"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";

import {
  getContentFetchErrorMessage,
  mergeUniqueContents,
} from "@/lib/content";
import { type GetContentsParams, getContents } from "@/services/contentService";
import type { Content, ContentsResponse } from "@/types/content";

// 백엔드 /api/v1/contents의 기본 size(20)와 동일하게 맞춰, "더보기"가 항상
// 서버 기본 페이지와 같은 크기로 다음 페이지를 요청하게 한다.
export const CONTENT_PAGE_SIZE = 20;

export type ContentQueryParams = Omit<GetContentsParams, "page" | "size">;

interface UseLoadMoreContentsParams {
  // 검색 조건(지역/날짜/박수/동반자)이 바뀌면 새 쿼리로 취급되어 누적 상태가
  // 자동으로 초기화되도록, 조건을 그대로 쿼리 키에 포함한다.
  queryKey: readonly unknown[];
  queryParams: ContentQueryParams;
  initialContents: Content[];
  initialTotal: number;
  pageSize?: number;
}

interface UseLoadMoreContentsResult {
  contents: Content[];
  total: number;
  hasMore: boolean;
  // 첫 페이지(서버가 이미 받아온 상태) 그대로면 접을 게 없으므로 false.
  canCollapse: boolean;
  isLoadingMore: boolean;
  errorMessage: string | null;
  loadMore: () => void;
  // "더보기"의 반대 — 캐시는 그대로 두고 화면에 보이는 페이지 수만 1로
  // 되돌린다. 다시 "더보기"를 누르면 재요청 없이 즉시 펼쳐진다.
  collapse: () => void;
}

export function useLoadMoreContents({
  queryKey,
  queryParams,
  initialContents,
  initialTotal,
  pageSize = CONTENT_PAGE_SIZE,
}: UseLoadMoreContentsParams): UseLoadMoreContentsResult {
  // "더보기"로 몇 페이지째까지 화면에 노출할지. 실제로 가져온 페이지
  // 수(query.data.pages.length)와는 별개로 관리해, "간략히"가 캐시를
  // 지우지 않고 노출 범위만 줄이게 한다.
  const [visiblePageCount, setVisiblePageCount] = useState(1);

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
    // 서버 컴포넌트가 이미 받아온 0페이지 결과를 첫 페이지로 시드해 첫
    // 렌더에서 재요청하지 않는다.
    initialData: {
      pages: [{ contents: initialContents, total: initialTotal }],
      pageParams: [0],
    },
    // staleTime을 기본값(0)으로 두면 시드한 initialData를 즉시 stale로
    // 간주해 마운트하자마자 0페이지를 백그라운드로 다시 요청한다(useAuth와
    // 동일한 이유). "더보기" 클릭(fetchNextPage)으로만 다음 페이지를
    // 가져오면 되므로 자동 재요청은 막는다.
    staleTime: Number.POSITIVE_INFINITY,
  });

  const pages = query.data?.pages ?? [];
  const visiblePages = pages.slice(0, visiblePageCount);

  // 배열 자체는 매 렌더 새로 만들어지지만 항목 수가 많지 않아(현재 최대
  // 수백 개) 매번 다시 걸러도 비용이 미미하다. useMemo로 감쌀 필요가 없다.
  const contents = mergeUniqueContents(visiblePages.flatMap((p) => p.contents));
  const total = pages.at(-1)?.total ?? initialTotal;

  async function loadMore() {
    if (visiblePageCount < pages.length) {
      // 이전에 "간략히"로 접었던 페이지라 이미 캐시돼 있다 — 재요청 없이
      // 바로 펼친다.
      setVisiblePageCount((n) => n + 1);
      return;
    }
    const result = await query.fetchNextPage();
    if ((result.data?.pages.length ?? pages.length) > pages.length) {
      setVisiblePageCount((n) => n + 1);
    }
  }

  return {
    contents,
    total,
    hasMore: contents.length < total,
    canCollapse: visiblePageCount > 1,
    isLoadingMore: query.isFetchingNextPage,
    errorMessage: query.isError
      ? getContentFetchErrorMessage(query.error)
      : null,
    loadMore: () => {
      void loadMore();
    },
    collapse: () => setVisiblePageCount(1),
  };
}
