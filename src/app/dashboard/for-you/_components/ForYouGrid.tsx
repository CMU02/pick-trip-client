"use client";

import { ContentBrowser } from "@/components/ContentBrowser";
import type { ContentQueryParams } from "@/hooks/useLoadMoreContents";
import type { Content } from "@/types/content";

import { ForYouCard } from "./ForYouCard";

interface ForYouGridProps {
  initialContents: Content[];
  initialTotal: number;
  queryParams: ContentQueryParams;
}

// ExploreGrid와 동일한 구조 — 필터/헤더/그리드/더보기는 ContentBrowser가 맡고,
// 카드만 ForYouCard(찜+담기 액션)로 주입한다. 지역은 탭 클릭 시 서버 재요청,
// 카테고리/검색어는 클라이언트 필터다.
export function ForYouGrid({
  initialContents,
  initialTotal,
  queryParams,
}: ForYouGridProps) {
  return (
    <ContentBrowser
      initialContents={initialContents}
      initialTotal={initialTotal}
      queryParams={queryParams}
      renderCard={(content) => (
        <ForYouCard key={content.id} content={content} />
      )}
      gridClassName="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
    />
  );
}
