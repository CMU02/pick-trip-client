"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import {
  CONTENT_PAGE_SIZE,
  getContentFetchErrorMessage,
  mergeUniqueContents,
} from "@/lib/content";
import { type GetContentsParams, getContents } from "@/services/contentService";
import type { Content, ContentsResponse } from "@/types/content";

export { CONTENT_PAGE_SIZE };

// 지역 탭(시드 없는 조건)도 이 시간 동안은 신선한 것으로 간주해, 같은 조건으로
// 다시 마운트해도(탭 재선택) 즉시 백그라운드 refetch를 걸지 않는다. 콘텐츠
// 동기화 배치가 주 1회라(docs/plan/content-load-more.md) 넉넉히 잡아도 안전.
// (docs/plan/contents-list-tanstack-query-cache.md 참고)
export const CONTENT_LIST_STALE_TIME = 60 * 60 * 1000; // 1시간

export type ContentQueryParams = Omit<GetContentsParams, "page" | "size">;

interface UseLoadMoreContentsParams {
  // 검색 조건(지역/날짜/박수/동반자)이 바뀌면 새 쿼리로 취급되어 누적 상태가
  // 자동으로 초기화되도록, 조건을 그대로 쿼리 키에 포함한다.
  queryKey: readonly unknown[];
  queryParams: ContentQueryParams;
  // 서버 컴포넌트가 이미 이 조건으로 0페이지를 받아온 경우에만 넘긴다(예:
  // 지역 탭이 "전체"일 때). 조건이 바뀌어 SSR 데이터를 재사용할 수 없으면
  // 둘 다 생략한다 — 훅이 마운트 즉시 네트워크로 0페이지를 받아온다.
  initialContents?: Content[];
  initialTotal?: number;
  pageSize?: number;
}

interface UseLoadMoreContentsResult {
  contents: Content[];
  total: number;
  hasMore: boolean;
  // 시드도 없고 아직 아무 페이지도 못 받은 첫 로딩 상태(스켈레톤 표시용).
  isLoading: boolean;
  isLoadingMore: boolean;
  errorMessage: string | null;
  loadMore: () => void;
}

export function useLoadMoreContents({
  queryKey,
  queryParams,
  initialContents,
  initialTotal,
  pageSize = CONTENT_PAGE_SIZE,
}: UseLoadMoreContentsParams): UseLoadMoreContentsResult {
  const hasSeed = initialContents !== undefined && initialTotal !== undefined;

  const query = useInfiniteQuery<ContentsResponse>({
    queryKey,
    queryFn: ({ pageParam }) =>
      getContents({
        ...queryParams,
        page: pageParam as number,
        size: pageSize,
      }),
    initialPageParam: 0,
    // 이번 페이지에서 아무 항목도 못 받았거나, 지금까지 받은 개수가 total에
    // 이미 도달했으면 더 요청하지 않는다. 지역별로 먼저 소진된 지역은 빈
    // items를 반환하므로(백엔드 확인 완료) 별도 에러 처리 없이 안전하다.
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.contents.length === 0) return undefined;
      const loadedCount = allPages.reduce(
        (sum, page) => sum + page.contents.length,
        0,
      );
      return loadedCount < lastPage.total ? allPages.length : undefined;
    },
    // 서버 컴포넌트가 이미 이 조건으로 받아온 0페이지가 있을 때만 시드한다.
    // 지역 탭 전환처럼 조건이 SSR 시점과 달라지면 시드를 생략해 마운트
    // 즉시 새 조건으로 네트워크 요청을 보내게 한다 — 그러지 않으면 다른
    // 조건(예: 전체 지역)의 데이터가 화면에 그대로 남는다.
    initialData: hasSeed
      ? {
          pages: [
            { contents: initialContents ?? [], total: initialTotal ?? 0 },
          ],
          pageParams: [0],
        }
      : undefined,
    // 시드가 있으면(SSR 0페이지) 무한대로 둬 재검증하지 않는다. 시드가 없는
    // 지역 탭도 최소 CONTENT_LIST_STALE_TIME 동안은 fresh로 간주해, 같은
    // 탭을 다시 선택할 때마다 매번 백그라운드 refetch가 나가지 않게 한다.
    staleTime: hasSeed ? Number.POSITIVE_INFINITY : CONTENT_LIST_STALE_TIME,
  });

  const pages = query.data?.pages ?? [];
  const contents = mergeUniqueContents(pages.flatMap((p) => p.contents));
  // total은 첫 페이지(0페이지 = 모든 지역을 한 번에 조회) 값으로 고정한다.
  // 마지막 페이지 값을 쓰면 백엔드 totalCount가 재동기화 등으로 조금이라도
  // 흔들릴 때 "더보기"를 누를 때마다 표시 개수(222 ↔ 226)가 달라진다.
  const total = pages[0]?.total ?? initialTotal ?? 0;

  return {
    contents,
    total,
    // 다음 페이지 존재 여부는 React Query의 판단(getNextPageParam 결과)을
    // 따른다. total이 흔들려도 눌리지 않는 "더보기" 버튼이 생기지 않는다.
    hasMore: query.hasNextPage ?? contents.length < total,
    isLoading: query.isLoading,
    isLoadingMore: query.isFetchingNextPage,
    errorMessage: query.isError
      ? getContentFetchErrorMessage(query.error)
      : null,
    loadMore: () => {
      void query.fetchNextPage();
    },
  };
}
