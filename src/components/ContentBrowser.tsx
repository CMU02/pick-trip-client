"use client";

import { type ReactNode, useState } from "react";

import { ContentFilter } from "@/components/ContentFilter";
import { Icon } from "@/components/ui/icon";
import {
  CONTENT_PAGE_SIZE,
  type ContentQueryParams,
  useLoadMoreContents,
} from "@/hooks/useLoadMoreContents";
import {
  CATEGORY_LABELS,
  type Content,
  type ContentCategory,
} from "@/types/content";
import { REGION_LABELS, REGIONS, type Region } from "@/types/region";

interface ContentBrowserProps {
  initialContents: Content[];
  initialTotal: number;
  // .regions는 이 화면에서 탐색을 허용할 지역 집합(탭 소스)이기도 하다.
  // /explore는 항상 REGIONS 전체, /contents는 사용자가 조건 선택 단계에서
  // 고른 지역만 들어온다 — 여기서 REGIONS 전체로 되돌리면 안 된다.
  queryParams: ContentQueryParams;
  renderCard: (content: Content) => ReactNode;
  gridClassName: string;
}

export function ContentBrowser({
  initialContents,
  initialTotal,
  queryParams,
  renderCard,
  gridClassName,
}: ContentBrowserProps) {
  const allowedRegions = REGIONS.filter((r) => queryParams.regions.includes(r));

  const [selectedRegion, setSelectedRegion] = useState<Region | "ALL">("ALL");
  const [selectedCategories, setSelectedCategories] = useState<
    ContentCategory[]
  >([]);
  const [keyword, setKeyword] = useState("");

  const isInitial = selectedRegion === "ALL";
  const effectiveRegions = isInitial ? allowedRegions : [selectedRegion];
  const effectiveParams: ContentQueryParams = {
    ...queryParams,
    regions: effectiveRegions,
  };

  const {
    contents: loadedContents,
    total,
    hasMore,
    isLoading,
    isLoadingMore,
    errorMessage,
    loadMore,
  } = useLoadMoreContents({
    queryKey: ["contents", effectiveParams],
    queryParams: effectiveParams,
    initialContents: isInitial ? initialContents : undefined,
    initialTotal: isInitial ? initialTotal : undefined,
  });

  const q = keyword.trim().toLowerCase();
  const hasClientFilter = selectedCategories.length > 0 || q !== "";
  const filtered = loadedContents.filter((c) => {
    const matchCategory =
      selectedCategories.length === 0 ||
      (c.category !== undefined && selectedCategories.includes(c.category));
    const matchKeyword =
      q === "" ||
      c.name.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q);
    return matchCategory && matchKeyword;
  });

  function resetFilters() {
    setSelectedRegion("ALL");
    setSelectedCategories([]);
    setKeyword("");
  }

  return (
    <div className="flex flex-col gap-4">
      <ContentFilter
        regions={allowedRegions}
        selectedRegion={selectedRegion}
        selectedCategories={selectedCategories}
        keyword={keyword}
        onRegionChange={setSelectedRegion}
        onCategoryChange={setSelectedCategories}
        onKeywordChange={setKeyword}
      />

      <ResultHeader
        total={total}
        loadedCount={loadedContents.length}
        filteredCount={filtered.length}
        hasClientFilter={hasClientFilter}
        selectedRegion={selectedRegion}
        selectedCategories={selectedCategories}
        keyword={keyword}
        onClearRegion={() => setSelectedRegion("ALL")}
        onClearCategory={(c) =>
          setSelectedCategories(selectedCategories.filter((x) => x !== c))
        }
        onClearKeyword={() => setKeyword("")}
        onResetAll={resetFilters}
      />

      {isLoading ? (
        <div className={`grid gap-4 ${gridClassName}`}>
          <SkeletonCards count={8} />
        </div>
      ) : filtered.length === 0 ? (
        <p className="flex min-h-[40vh] items-center justify-center text-center text-sm text-muted-foreground">
          {loadedContents.length === 0
            ? "콘텐츠가 없습니다"
            : "조건에 맞는 콘텐츠가 없습니다"}
        </p>
      ) : (
        <div className={`grid gap-4 ${gridClassName}`}>
          {filtered.map((c) => renderCard(c))}
          {isLoadingMore && <SkeletonCards count={4} />}
        </div>
      )}

      {errorMessage && (
        <p className="text-center text-sm text-destructive">{errorMessage}</p>
      )}

      <MoreZone
        loadedCount={loadedContents.length}
        total={total}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        onLoadMore={loadMore}
      />
    </div>
  );
}

function ResultHeader({
  total,
  loadedCount,
  filteredCount,
  hasClientFilter,
  selectedRegion,
  selectedCategories,
  keyword,
  onClearRegion,
  onClearCategory,
  onClearKeyword,
  onResetAll,
}: {
  total: number;
  loadedCount: number;
  filteredCount: number;
  hasClientFilter: boolean;
  selectedRegion: Region | "ALL";
  selectedCategories: ContentCategory[];
  keyword: string;
  onClearRegion: () => void;
  onClearCategory: (category: ContentCategory) => void;
  onClearKeyword: () => void;
  onResetAll: () => void;
}) {
  const hasAnyFilter =
    selectedRegion !== "ALL" ||
    selectedCategories.length > 0 ||
    keyword.trim() !== "";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-bold">
        {hasClientFilter
          ? `불러온 ${loadedCount}개 중 ${filteredCount}개`
          : `${total}개 결과`}
      </span>

      {selectedRegion !== "ALL" && (
        <FilterPill
          label={REGION_LABELS[selectedRegion]}
          onClear={onClearRegion}
        />
      )}
      {selectedCategories.map((c) => (
        <FilterPill
          key={c}
          label={CATEGORY_LABELS[c]}
          onClear={() => onClearCategory(c)}
        />
      ))}
      {keyword.trim() && (
        <FilterPill label={`"${keyword.trim()}"`} onClear={onClearKeyword} />
      )}
      {hasAnyFilter && (
        <button
          type="button"
          onClick={onResetAll}
          className="text-sm font-semibold text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          초기화
        </button>
      )}

      {!hasClientFilter && total > 0 && (
        <span className="ml-auto text-xs text-muted-foreground">
          {loadedCount} / {total} 표시 중
        </span>
      )}
    </div>
  );
}

function FilterPill({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent py-1 pr-2 pl-2.5 text-[13px] font-bold text-accent-foreground">
      {label}
      <button
        type="button"
        aria-label={`${label} 해제`}
        onClick={onClear}
        className="opacity-65 hover:opacity-100"
      >
        <Icon name="close" size={12} />
      </button>
    </span>
  );
}

function MoreZone({
  loadedCount,
  total,
  hasMore,
  isLoadingMore,
  onLoadMore,
}: {
  loadedCount: number;
  total: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
}) {
  if (!hasMore) {
    return total > 0 ? (
      <p className="flex items-center justify-center gap-1.5 py-6 text-sm font-medium text-muted-foreground">
        {total}개를 모두 확인했어요
      </p>
    ) : null;
  }

  const pct = total > 0 ? Math.round((loadedCount / total) * 100) : 0;
  const nextCount = Math.min(CONTENT_PAGE_SIZE, total - loadedCount);

  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <button
        type="button"
        onClick={onLoadMore}
        disabled={isLoadingMore}
        className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-6 text-[15px] font-bold shadow-sm transition hover:border-primary hover:text-primary disabled:opacity-60"
      >
        {isLoadingMore ? "불러오는 중" : `${nextCount}개 더보기`}
      </button>
      <div className="h-[3px] w-48 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-primary transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">
        {loadedCount} / {total}
      </span>
    </div>
  );
}

function SkeletonCards({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: 고정 개수 스켈레톤이라 순서/식별자가 의미 없음
          key={i}
          className="animate-pulse overflow-hidden rounded-[18px] border border-border bg-card"
        >
          <div className="h-[150px] bg-muted" />
          <div className="flex flex-col gap-2 p-4">
            <div className="h-3 w-2/3 rounded-full bg-muted" />
            <div className="h-2.5 w-2/5 rounded-full bg-muted" />
            <div className="h-2.5 w-4/5 rounded-full bg-muted" />
          </div>
        </div>
      ))}
    </>
  );
}
