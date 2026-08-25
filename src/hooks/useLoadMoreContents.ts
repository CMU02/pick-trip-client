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
    // 시드가 있을 때만 무한대로 둔다 — 시드가 없으면 기본 staleTime(0)이라
    // 마운트 즉시(첫 fetch로) 데이터를 받아온다.
    staleTime: hasSeed ? Number.POSITIVE_INFINITY : undefined,
  });

  const pages = query.data?.pages ?? [];
  const contents = mergeUniqueContents(pages.flatMap((p) => p.contents));
  const total = pages.at(-1)?.total ?? initialTotal ?? 0;

  return {
    contents,
    total,
    hasMore: contents.length < total,
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
