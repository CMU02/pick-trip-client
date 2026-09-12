"use client";

import {
  useMutation,
  useMutationState,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { parseApiError } from "@/lib/errors";
import {
  FAVORITES_ADD_MUTATION_KEY,
  FAVORITES_QUERY_KEY,
  FAVORITES_REMOVE_MUTATION_KEY,
} from "@/lib/queryKeys";
import {
  addFavorite,
  contentToAddFavoriteRequest,
  favoriteToContent,
  getFavorites,
  removeFavorite,
} from "@/services/favoriteService";
import type { Content } from "@/types/content";

interface AddContext {
  previous: Content[];
  // onMutate가 낙관적 업데이트를 반영한 직후의 캐시 세대(dataUpdatedAt).
  // onSuccess/onError 시점에 이 값이 달라져 있다면 그 사이 로그아웃(캐시
  // 제거)이나 새 로그인의 refetch가 캐시를 건드린 것이므로 되돌리거나
  // 덮어쓰지 않는다.
  generation: number | undefined;
}

interface RemoveContext {
  previous: Content[];
  generation: number | undefined;
}

function currentFavoritesGeneration(
  queryClient: ReturnType<typeof useQueryClient>,
): number | undefined {
  return queryClient.getQueryState<Content[]>(FAVORITES_QUERY_KEY)
    ?.dataUpdatedAt;
}

// 서버 찜 목록(/api/v1/favorites)을 React Query로 캐싱하는 훅. 비로그인
// 상태에서는 조회하지 않고 items를 빈 배열로 둔다. add/remove는 낙관적으로
// 즉시 반영하고, 서버가 이미 같은 상태(중복 찜/찜 없음)라고 응답하면
// 그 낙관적 반영을 성공으로 간주해 롤백하지 않는다.
export function useFavorites() {
  const { status, runAuthed } = useAuth();
  const queryClient = useQueryClient();

  const favoritesQuery = useQuery({
    queryKey: FAVORITES_QUERY_KEY,
    queryFn: async () => {
      const response = await runAuthed((token) => getFavorites(token));
      return response.items.map(favoriteToContent);
    },
    enabled: status === "authenticated",
    staleTime: Number.POSITIVE_INFINITY,
  });

  const items = favoritesQuery.data ?? [];

  const addMutation = useMutation({
    // 카드마다 이 훅을 따로 호출해 useMutation 인스턴스도 제각각이므로,
    // 같은 콘텐츠에 대한 요청이 다른 인스턴스에서 이미 진행 중인지는
    // mutationKey로 전역 뮤테이션 캐시를 봐야 알 수 있다(아래 isFavoritePending 참고).
    mutationKey: FAVORITES_ADD_MUTATION_KEY,
    mutationFn: (content: Content) =>
      runAuthed((token) =>
        addFavorite(contentToAddFavoriteRequest(content), token),
      ),
    onMutate: async (content): Promise<AddContext> => {
      await queryClient.cancelQueries({ queryKey: FAVORITES_QUERY_KEY });
      const previous =
        queryClient.getQueryData<Content[]>(FAVORITES_QUERY_KEY) ?? [];
      if (!previous.some((c) => c.id === content.id)) {
        queryClient.setQueryData<Content[]>(FAVORITES_QUERY_KEY, [
          ...previous,
          content,
        ]);
      }
      return { previous, generation: currentFavoritesGeneration(queryClient) };
    },
    onSuccess: (response, content, context) => {
      // 응답을 기다리는 사이 로그아웃으로 캐시가 비워졌거나 다음 로그인의
      // refetch가 이미 새 데이터를 채웠다면, 이 요청은 더 이상 현재
      // 세션의 것이 아니므로 캐시에 쓰지 않는다.
      if (currentFavoritesGeneration(queryClient) !== context.generation) {
        return;
      }
      const current =
        queryClient.getQueryData<Content[]>(FAVORITES_QUERY_KEY) ?? [];
      queryClient.setQueryData<Content[]>(
        FAVORITES_QUERY_KEY,
        current.map((c) =>
          c.id === content.id ? favoriteToContent(response) : c,
        ),
      );
    },
    onError: (err, _content, context) => {
      if (currentFavoritesGeneration(queryClient) !== context?.generation) {
        return;
      }
      // 이미 찜한 상태라 서버가 중복으로 거절한 경우, 화면에는 이미 찜한
      // 상태로 보이는 게 맞으므로 낙관적 업데이트를 그대로 둔다.
      if (parseApiError(err).code === "FAVORITE_DUPLICATE") return;
      if (context?.previous) {
        queryClient.setQueryData(FAVORITES_QUERY_KEY, context.previous);
      }
    },
  });

  const removeMutation = useMutation({
    mutationKey: FAVORITES_REMOVE_MUTATION_KEY,
    mutationFn: (contentId: string) =>
      runAuthed((token) => removeFavorite(contentId, token)),
    onMutate: async (contentId): Promise<RemoveContext> => {
      await queryClient.cancelQueries({ queryKey: FAVORITES_QUERY_KEY });
      const previous =
        queryClient.getQueryData<Content[]>(FAVORITES_QUERY_KEY) ?? [];
      queryClient.setQueryData<Content[]>(
        FAVORITES_QUERY_KEY,
        previous.filter((c) => c.id !== contentId),
      );
      return { previous, generation: currentFavoritesGeneration(queryClient) };
    },
    onError: (err, _contentId, context) => {
      if (currentFavoritesGeneration(queryClient) !== context?.generation) {
        return;
      }
      // 이미 찜이 없는 상태라 서버가 404로 응답한 경우도 마찬가지로 낙관적
      // 업데이트(제거됨)를 유지한다.
      if (parseApiError(err).code === "FAVORITE_NOT_FOUND") return;
      if (context?.previous) {
        queryClient.setQueryData(FAVORITES_QUERY_KEY, context.previous);
      }
    },
  });

  // 진행 중인 add/remove 요청의 대상 콘텐츠 id 목록. useFavorites()는
  // 카드마다 따로 호출되어 addMutation/removeMutation도 인스턴스별로
  // 따로 존재하므로, 이 훅 인스턴스의 addMutation.isPending만으로는 "같은
  // 콘텐츠에 대한 요청이 다른(예: 언마운트된) 인스턴스에서 이미 진행
  // 중인지"를 알 수 없다. mutationKey로 전역 뮤테이션 캐시를 조회하면
  // 어느 인스턴스가 요청을 시작했는지와 무관하게 판단할 수 있다.
  const pendingAddIds = useMutationState({
    filters: { mutationKey: FAVORITES_ADD_MUTATION_KEY, status: "pending" },
    select: (mutation) => (mutation.state.variables as Content).id,
  });
  const pendingRemoveIds = useMutationState({
    filters: { mutationKey: FAVORITES_REMOVE_MUTATION_KEY, status: "pending" },
    select: (mutation) => mutation.state.variables as string,
  });

  return {
    items,
    add: (content: Content) => addMutation.mutate(content),
    remove: (contentId: string) => removeMutation.mutate(contentId),
    // items 배열을 직접 구독한 값으로 계산해야 한다 — isFavorited(id) 같은
    // 캐시된 함수 참조를 그대로 노출하면 React Compiler가 순수 함수로
    // 오인해 상태 변경 시 재계산을 건너뛴다(useFavoriteHeart 참고).
    isFavorited: (contentId: string) => items.some((c) => c.id === contentId),
    // 위 pendingAddIds/pendingRemoveIds를 그대로 노출하는 대신 함수로
    // 감싼다 — 호출부(useFavoriteHeart)가 콘텐츠 id 하나에 대한 결과만
    // 필요하기 때문이다.
    isFavoritePending: (contentId: string) =>
      pendingAddIds.includes(contentId) || pendingRemoveIds.includes(contentId),
    isLoading: favoritesQuery.isPending && status === "authenticated",
    isError: favoritesQuery.isError,
    refetch: favoritesQuery.refetch,
    isAdding: addMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}
