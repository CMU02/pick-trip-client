"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useBasket } from "@/hooks/useBasket";
import { CONTENT_LIST_STALE_TIME } from "@/hooks/useLoadMoreContents";
import { getContents } from "@/services/contentService";
import {
  CATEGORY_LABELS,
  CONTENT_CATEGORY_ORDER,
  type Content,
  type ContentCategory,
} from "@/types/content";
import { ALL_REGIONS_QUERY, REGIONS } from "@/types/region";

import { TryItCard } from "./TryItCard";

interface TryItGalleryProps {
  // TryItSection이 서버에서 받아온 초기 목록. TanStack Query의 initialData로
  // 넣어 SSR HTML에 콘텐츠가 담기고, 클라이언트에서는 CONTENT_LIST_STALE_TIME
  // 동안 재요청하지 않는다(홈↔다른 페이지를 오가도 네트워크 없음).
  initialContents: Content[];
}

type ChipKey = "ALL" | ContentCategory;

// TryItSection과 동일한 조회 조건. 카테고리 파라미터가 백엔드에 없어 넉넉한
// 샘플을 한 번 받아 클라이언트에서 칩으로 거른다.
const TRY_IT_SIZE = 48;

// ["contents", …] 프리픽스라 Providers의 setQueryDefaults(["contents"])가
// 붙여둔 localStorage 퍼시스터·gcTime을 그대로 물려받는다.
const TRY_IT_QUERY_KEY = ["contents", "home-try-it", TRY_IT_SIZE] as const;

const CHIPS: ChipKey[] = ["ALL", ...CONTENT_CATEGORY_ORDER];

// 담은 결과로 이어갈 AI 일정 생성 흐름. 홈은 지역을 고르지 않으므로 히어로
// "AI 일정 살펴보기"와 동일하게 전체 지역으로 조건 입력 단계에 진입한다.
const CONDITIONS_HREF = `/select/conditions?regions=${ALL_REGIONS_QUERY}`;

function chipLabel(key: ChipKey): string {
  return key === "ALL" ? "전체" : CATEGORY_LABELS[key];
}

export function TryItGallery({ initialContents }: TryItGalleryProps) {
  // items만 구독한다 — 담기 토글은 각 카드의 ContentCardActions가 직접 한다.
  const { items } = useBasket();
  const [selected, setSelected] = useState<ChipKey>("ALL");

  const { data } = useQuery({
    queryKey: TRY_IT_QUERY_KEY,
    queryFn: () =>
      getContents({
        regions: [...REGIONS],
        startDate: new Date().toISOString().split("T")[0],
        nights: 0,
        size: TRY_IT_SIZE,
      }),
    initialData: {
      contents: initialContents,
      total: initialContents.length,
    },
    staleTime: CONTENT_LIST_STALE_TIME,
  });
  const contents = data.contents;

  const basketCount = items.length;
  const hint =
    basketCount === 0
      ? "두 곳만 담아도 일정을 만들 수 있어요"
      : `${basketCount}개 담았어요. 두 곳 이상이면 바로 생성됩니다`;

  const filtered = (
    selected === "ALL"
      ? contents
      : contents.filter((c) => c.category === selected)
  ).slice(0, 4);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11.5px] font-extrabold tracking-[0.14em] text-primary">
            TRY IT
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            여기서 바로 담아보세요
          </h2>
          <p className="mt-2.5 text-sm text-muted-foreground">{hint}</p>
        </div>

        <fieldset className="m-0 flex flex-wrap gap-1.5 border-0 p-0">
          <legend className="sr-only">카테고리 필터</legend>
          {CHIPS.map((key) => {
            const on = selected === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={on}
                onClick={() => setSelected(key)}
                className={
                  on
                    ? "rounded-full bg-[oklch(0.2_0.012_30)] px-4 py-2 text-[13px] font-bold text-white"
                    : "rounded-full border border-[oklch(0.92_0.012_30)] bg-white px-4 py-2 text-[13px] font-bold text-muted-foreground hover:border-primary/40"
                }
              >
                {chipLabel(key)}
              </button>
            );
          })}
        </fieldset>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-10 flex min-h-[160px] items-center justify-center text-sm text-muted-foreground">
          해당 카테고리 콘텐츠를 준비 중이에요
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((content) => (
            <TryItCard key={content.id} content={content} />
          ))}
        </div>
      )}

      <div className="mt-8 flex justify-center">
        {basketCount > 0 ? (
          <Button asChild size="lg">
            <Link href={CONDITIONS_HREF}>
              담은 {basketCount}곳으로 일정 만들기
            </Link>
          </Button>
        ) : (
          <Button asChild size="lg" variant="outline">
            <Link href={CONDITIONS_HREF}>여행 조건부터 정하기</Link>
          </Button>
        )}
      </div>
    </section>
  );
}
