"use client";

import { type ReactNode, useEffect, useState } from "react";

import { ContentFilter } from "@/components/ContentFilter";
import { Icon } from "@/components/ui/icon";
import {
  type ContentQueryParams,
  useLoadMoreContents,
} from "@/hooks/useLoadMoreContents";
import {
  CONTENT_PAGE_SIZE,
  filterContentsByIds,
  sortContentsByCategory,
} from "@/lib/content";
import {
  CATEGORY_LABELS,
  CONTENT_CATEGORIES,
  type Content,
  type ContentCategory,
  categoryCountFor,
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

// 마운트 시 한 번만 호출한다. SSR에는 window가 없으므로 빈 필터를 돌려준다
// (이 컴포넌트는 SSR에서도 렌더되지만, 초기 필터는 클라이언트에서 확정된다).
function readInitialFilter(): {
  region: string | null;
  categories: ContentCategory[];
  keyword: string;
  ids: string[];
} {
  if (typeof window === "undefined") {
    return { region: null, categories: [], keyword: "", ids: [] };
  }
  const params = new URLSearchParams(window.location.search);
  const rawCat = params.get("cat");
  const rawIds = params.get("ids");
  return {
    region: params.get("region"),
    categories: rawCat
      ? rawCat
          .split(",")
          .filter((c): c is ContentCategory =>
            CONTENT_CATEGORIES.includes(c as ContentCategory),
          )
      : [],
    keyword: params.get("q") ?? "",
    // 컬렉션(테마 묶음)이 넘겨준 콘텐츠 id 목록. 빈 값·공백은 버린다.
    ids: rawIds
      ? rawIds
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
  };
}

export function ContentBrowser({
  initialContents,
  initialTotal,
  queryParams,
  renderCard,
  gridClassName,
}: ContentBrowserProps) {
  const allowedRegions = REGIONS.filter((r) => queryParams.regions.includes(r));

  // 지역 탭·카테고리·검색어를 URL 쿼리(?region=&cat=&q=)에 싣는다. 상세에
  // 들어갔다 "목록으로"로 돌아오면(뒤로가기) 필터가 그대로 살아나고, 새로고침·
  // 링크 공유도 된다.
  //
  // URL은 마운트 시 딱 한 번 읽어 초기 state를 만들고, 이후로는 state만
  // 신뢰한다(단방향). next/navigation의 useSearchParams는 쓰지 않는다 — 이
  // 훅을 쓰면 Suspense 경계가 없을 때 이 클라이언트 트리 전체가 프리렌더에서
  // 빠지고(CSR 바일아웃), 로드 직후 첫 클릭이 유실되는 문제가 생긴다. 초기값만
  // 필요하므로 window.location.search를 직접 읽으면 그 문제가 사라진다.
  const [initialFilter] = useState(readInitialFilter);

  const [selectedRegion, setSelectedRegion] = useState<Region | "ALL">(() =>
    initialFilter.region &&
    allowedRegions.includes(initialFilter.region as Region)
      ? (initialFilter.region as Region)
      : "ALL",
  );
  const [selectedCategories, setSelectedCategories] = useState<
    ContentCategory[]
  >(initialFilter.categories);
  const [keyword, setKeyword] = useState(initialFilter.keyword);
  // 컬렉션 링크(/explore?ids=…)로 들어온 콘텐츠 id 목록. 카테고리·검색어와
  // 같은 성격의 클라이언트 필터다.
  const [idFilter, setIdFilter] = useState<string[]>(initialFilter.ids);

  // 필터 state → URL. router.replace 대신 history.replaceState를 쓰면 Next가
  // 서버 컴포넌트를 다시 부르지 않고(재fetch 없음) URL만 갱신한다. 히스토리
  // 엔트리도 안 쌓인다. 다른 페이지 조건(?regions=&startDate= 등)은
  // window.location.search를 베이스로 삼아 보존한다.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (selectedRegion === "ALL") params.delete("region");
    else params.set("region", selectedRegion);
    if (selectedCategories.length === 0) params.delete("cat");
    else params.set("cat", selectedCategories.join(","));
    const kw = keyword.trim();
    if (kw === "") params.delete("q");
    else params.set("q", kw);
    if (idFilter.length === 0) params.delete("ids");
    else params.set("ids", idFilter.join(","));

    const next = params.toString();
    if (next === new URLSearchParams(window.location.search).toString()) return;
    window.history.replaceState(
      null,
      "",
      next ? `?${next}` : window.location.pathname,
    );
  }, [selectedRegion, selectedCategories, keyword, idFilter]);

  const isInitial = selectedRegion === "ALL";
  const effectiveRegions = isInitial ? allowedRegions : [selectedRegion];
  const effectiveParams: ContentQueryParams = {
    ...queryParams,
    regions: effectiveRegions,
  };
  // getContents가 size를 지역별로 쪼개 fan-out 하므로, 여러 지역을 동시에
  // ("전체" 탭) 조회해도 한 페이지 합계가 CONTENT_PAGE_SIZE(20)로 유지된다.
  const {
    contents: loadedContents,
    total,
    hasMore,
    isLoading,
    isLoadingMore,
    errorMessage,
    loadMore,
  } = useLoadMoreContents({
    queryKey: ["contents", effectiveParams, CONTENT_PAGE_SIZE],
    queryParams: effectiveParams,
    initialContents: isInitial ? initialContents : undefined,
    initialTotal: isInitial ? initialTotal : undefined,
    pageSize: CONTENT_PAGE_SIZE,
  });

  const q = keyword.trim().toLowerCase();
  const hasClientFilter =
    selectedCategories.length > 0 || q !== "" || idFilter.length > 0;
  const matched = loadedContents.filter((c) => {
    const matchCategory =
      selectedCategories.length === 0 ||
      (c.category !== undefined && selectedCategories.includes(c.category));
    const matchKeyword =
      q === "" ||
      c.name.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q);
    const matchIds = idFilter.length === 0 || idFilter.includes(c.id);
    return matchCategory && matchKeyword && matchIds;
  });
  // id 필터(컬렉션)가 걸리면 그 id 목록 순서를 그대로 따른다. 아니면 카테고리를
  // 여러 개 동시에 선택했을 때만(예: 음식+관광지+문화) 로드 순서 대신
  // CONTENT_CATEGORIES 선언 순서로 묶어서 보여준다.
  const filtered =
    idFilter.length > 0
      ? filterContentsByIds(matched, idFilter)
      : selectedCategories.length > 1
        ? sortContentsByCategory(matched)
        : matched;

  // 카테고리/검색어는 여전히 클라이언트 필터라(백엔드에 category 파라미터가
  // 없음), 서버 페이지 하나에 여러 카테고리가 섞여 온다. 필터가 걸린 채로
  // "더보기"를 누르면 한 번에 얼마가 늘지 예측할 수 없고, 계속 누르다 보면
  // 결국 전체 데이터가 다 로드돼 필터를 건 의미가 없어진다.
  // 그래서 필터가 걸리면 남은 서버 페이지를 조용히 백그라운드로 끝까지
  // 받아두고(전체가 최대 수백 개 수준이라 비용이 작다), 화면 노출은 아래
  // visibleCount로 filtered 배열을 client-side로 끊어 보여준다 — "더보기"를
  // 눌러도 네트워크 없이 그 카테고리 개수만큼만 정확히 늘고, 이미 보여준
  // 항목이 다시 나오는(중복) 일도 없다.
  useEffect(() => {
    if (!hasClientFilter) return;
    if (!hasMore) return;
    if (isLoadingMore) return;
    if (errorMessage) return;
    loadMore();
  }, [hasClientFilter, hasMore, isLoadingMore, errorMessage, loadMore]);

  // 필터가 걸려있을 때 화면에 몇 개까지 펼쳐 보여줄지. 지역/카테고리/검색어
  // 조합이 바뀌면 처음(한 페이지 분량)으로 되돌아간다. 이펙트 본문은 이
  // 값들을 읽지 않고 리셋 트리거로만 쓰므로 exhaustive-deps 경고를 끈다.
  const [visibleCount, setVisibleCount] = useState(CONTENT_PAGE_SIZE);
  // biome-ignore lint/correctness/useExhaustiveDependencies: 값을 읽지 않고 변경 트리거로만 사용
  useEffect(() => {
    setVisibleCount(CONTENT_PAGE_SIZE);
  }, [selectedRegion, selectedCategories, keyword, idFilter]);

  const backgroundLoading = hasClientFilter && hasMore;
  const visibleFiltered = hasClientFilter
    ? filtered.slice(0, visibleCount)
    : filtered;

  // 카테고리만 걸렸을 때(검색어 없음)는 백엔드에 category 파라미터가 없어
  // "이 카테고리 전체 N개"를 실시간으로 셀 수 없다. 대신 지역×카테고리 정적
  // 실측치(categoryCountFor)를 총계로 쓰고, 화면에 펼쳐 보여준 수를 함께 보여준다.
  const categoryTotal =
    selectedCategories.length > 0 && q === ""
      ? categoryCountFor(selectedCategories, effectiveRegions)
      : null;

  function resetFilters() {
    setSelectedRegion("ALL");
    setSelectedCategories([]);
    setKeyword("");
    setIdFilter([]);
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
        shownCount={visibleFiltered.length}
        categoryTotal={categoryTotal}
        hasClientFilter={hasClientFilter}
        selectedRegion={selectedRegion}
        selectedCategories={selectedCategories}
        keyword={keyword}
        idFilterCount={idFilter.length}
        onClearRegion={() => setSelectedRegion("ALL")}
        onClearCategory={(c) =>
          setSelectedCategories(selectedCategories.filter((x) => x !== c))
        }
        onClearKeyword={() => setKeyword("")}
        onClearIdFilter={() => setIdFilter([])}
        onResetAll={resetFilters}
      />

      {isLoading ? (
        <div className={`grid gap-4 ${gridClassName}`}>
          <SkeletonCards count={8} />
        </div>
      ) : visibleFiltered.length === 0 ? (
        backgroundLoading ? (
          // 아직 남은 페이지를 다 안 뒤져봤으니 "없다"고 단정하지 않는다.
          <div className={`grid gap-4 ${gridClassName}`}>
            <SkeletonCards count={4} />
          </div>
        ) : (
          <p className="flex min-h-[40vh] items-center justify-center text-center text-sm text-muted-foreground">
            {loadedContents.length === 0
              ? "콘텐츠가 없습니다"
              : "조건에 맞는 콘텐츠가 없습니다"}
          </p>
        )
      ) : (
        <div className={`grid gap-4 ${gridClassName}`}>
          {visibleFiltered.map((c) => renderCard(c))}
          {!hasClientFilter && isLoadingMore && <SkeletonCards count={4} />}
        </div>
      )}

      {errorMessage && (
        <p className="text-center text-sm text-destructive">{errorMessage}</p>
      )}

      {hasClientFilter ? (
        <FilteredMoreZone
          visibleCount={visibleFiltered.length}
          filteredTotal={filtered.length}
          backgroundLoading={backgroundLoading}
          onReveal={() => setVisibleCount((v) => v + CONTENT_PAGE_SIZE)}
        />
      ) : (
        <MoreZone
          loadedCount={loadedContents.length}
          total={total}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          onLoadMore={loadMore}
        />
      )}
    </div>
  );
}

function ResultHeader({
  total,
  loadedCount,
  filteredCount,
  shownCount,
  categoryTotal,
  hasClientFilter,
  selectedRegion,
  selectedCategories,
  keyword,
  idFilterCount,
  onClearRegion,
  onClearCategory,
  onClearKeyword,
  onClearIdFilter,
  onResetAll,
}: {
  total: number;
  loadedCount: number;
  filteredCount: number;
  shownCount: number;
  categoryTotal: number | null;
  hasClientFilter: boolean;
  selectedRegion: Region | "ALL";
  selectedCategories: ContentCategory[];
  keyword: string;
  idFilterCount: number;
  onClearRegion: () => void;
  onClearCategory: (category: ContentCategory) => void;
  onClearKeyword: () => void;
  onClearIdFilter: () => void;
  onResetAll: () => void;
}) {
  const hasAnyFilter =
    selectedRegion !== "ALL" ||
    selectedCategories.length > 0 ||
    keyword.trim() !== "" ||
    idFilterCount > 0;

  const summary =
    idFilterCount > 0
      ? `선택한 ${idFilterCount}곳 중 ${shownCount}개 표시 중`
      : categoryTotal !== null
        ? `${selectedCategories.map((c) => CATEGORY_LABELS[c]).join("·")} ${categoryTotal}개 중 ${shownCount}개 표시 중`
        : hasClientFilter
          ? `불러온 ${loadedCount}개 중 ${filteredCount}개`
          : `${total}개 결과`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-bold">{summary}</span>

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
      {idFilterCount > 0 && (
        <FilterPill label="테마 선택" onClear={onClearIdFilter} />
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

// 카테고리/검색어 필터가 걸려있을 때의 더보기 — 서버가 아니라 이미 불러온
// filtered 배열을 client-side로 끊어 보여준다. 라벨/진행바가 그 필터의
// 실제 개수(filteredTotal) 기준이라 여러 카테고리가 섞여 늘어나는 일이 없다.
function FilteredMoreZone({
  visibleCount,
  filteredTotal,
  backgroundLoading,
  onReveal,
}: {
  visibleCount: number;
  filteredTotal: number;
  backgroundLoading: boolean;
  onReveal: () => void;
}) {
  const hasUnrevealed = visibleCount < filteredTotal;

  if (hasUnrevealed) {
    const pct =
      filteredTotal > 0 ? Math.round((visibleCount / filteredTotal) * 100) : 0;
    const nextCount = Math.min(CONTENT_PAGE_SIZE, filteredTotal - visibleCount);

    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <button
          type="button"
          onClick={onReveal}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-6 text-[15px] font-bold shadow-sm transition hover:border-primary hover:text-primary"
        >
          {`${nextCount}개 더보기`}
        </button>
        <div className="h-[3px] w-48 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {visibleCount} / {filteredTotal}
        </span>
      </div>
    );
  }

  if (backgroundLoading) {
    return (
      <p className="flex items-center justify-center py-6 text-sm text-muted-foreground">
        더 있는지 확인하는 중...
      </p>
    );
  }

  if (filteredTotal > 0) {
    return (
      <p className="flex items-center justify-center gap-1.5 py-6 text-sm font-medium text-muted-foreground">
        {filteredTotal}개를 모두 확인했어요
      </p>
    );
  }

  return null;
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
