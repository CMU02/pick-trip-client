"use client";

import Link from "next/link";
import { useState } from "react";

import { BasketLayout } from "@/components/BasketLayout";
import { RecommendedCard } from "@/components/RecommendedCard";
import { useBasket } from "@/hooks/useBasket";
import {
  ALL_REGIONS_QUERY,
  REGION_LABELS,
  REGIONS,
  type Region,
} from "@/types/region";

// 바구니에서 "AI 일정 생성"을 누르면 여행 조건(날짜·기간) 입력을 거쳐야 한다.
// 지역은 담아둔 콘텐츠에서 추려 넘기고, 비었으면 전체로 둔다.
function conditionsHref(regionsInBasket: Region[]) {
  const regions =
    regionsInBasket.length > 0 ? regionsInBasket.join(",") : ALL_REGIONS_QUERY;
  return `/select/conditions?regions=${regions}`;
}

export function BasketPageClient() {
  const { items } = useBasket();
  const [selectedRegion, setSelectedRegion] = useState<Region | "ALL">("ALL");

  // 바구니에 실제로 담긴 지역만 탭으로 노출한다(REGIONS 선언 순서 유지).
  const regionsInBasket = REGIONS.filter((region) =>
    items.some((item) => item.content.region === region),
  );

  // 담긴 지역이 사라지면(마지막 항목 삭제 등) 선택을 전체로 되돌린다.
  const activeRegion =
    selectedRegion !== "ALL" && regionsInBasket.includes(selectedRegion)
      ? selectedRegion
      : "ALL";

  const visibleItems =
    activeRegion === "ALL"
      ? items
      : items.filter((item) => item.content.region === activeRegion);

  return (
    <BasketLayout generateHref={conditionsHref(regionsInBasket)}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2.5">
          <span className="h-[22px] w-1 rounded-full bg-primary" />
          <h1 className="text-[28px] font-extrabold tracking-tight text-foreground">
            여행 바구니
          </h1>
          <span className="rounded-full bg-accent px-3 py-1 text-[12.5px] font-bold text-accent-foreground">
            {items.length}개
          </span>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-[22px] border-[1.5px] border-dashed border-[oklch(0.88_0.055_30)] bg-[oklch(0.99_0.012_30)] py-[70px] text-center">
            <p className="text-[15px] font-bold text-foreground/80">
              아직 담은 콘텐츠가 없습니다
            </p>
            <Link
              href="/explore"
              className="mt-1 rounded-xl bg-primary px-5.5 py-3 text-[13.5px] font-bold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              콘텐츠 탐색하러 가기 →
            </Link>
          </div>
        ) : (
          <>
            {regionsInBasket.length > 1 && (
              <div
                role="tablist"
                aria-label="지역"
                className="flex gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                <RegionTab
                  label="전체"
                  selected={activeRegion === "ALL"}
                  onClick={() => setSelectedRegion("ALL")}
                />
                {regionsInBasket.map((region) => (
                  <RegionTab
                    key={region}
                    label={REGION_LABELS[region]}
                    selected={activeRegion === region}
                    onClick={() => setSelectedRegion(region)}
                  />
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleItems.map((item) => (
                <RecommendedCard
                  key={item.content.id}
                  content={item.content}
                  detailHref={`/contents/${item.content.id}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </BasketLayout>
  );
}

// ContentFilter의 지역 탭과 같은 스타일. 바구니 페이지는 지역만 필요해
// 그 컴포넌트를 통째로 쓰지 않고 탭 조각만 옮겼다.
function RegionTab({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={
        selected
          ? "relative px-3.5 pt-2 pb-2.5 text-[15px] font-bold whitespace-nowrap text-primary after:absolute after:right-2 after:bottom-0 after:left-2 after:h-[2.5px] after:rounded-full after:bg-primary after:content-['']"
          : "px-3.5 pt-2 pb-2.5 text-[15px] font-bold whitespace-nowrap text-muted-foreground hover:text-foreground"
      }
    >
      {label}
    </button>
  );
}
