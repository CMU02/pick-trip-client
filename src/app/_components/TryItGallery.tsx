"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Icon } from "@/components/ui/icon";
import { useBasket } from "@/hooks/useBasket";
import { CONTENT_LIST_STALE_TIME } from "@/hooks/useLoadMoreContents";
import { getContents } from "@/services/contentService";
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  CONTENT_CATEGORY_ORDER,
  type Content,
  type ContentCategory,
} from "@/types/content";
import { REGIONS } from "@/types/region";

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

// 카테고리 파스텔 타일 (시안 TILE_BG / TILE_FG). 카테고리가 없는 콘텐츠는
// 중립 그라디언트 + map-outline로 떨어진다.
const TILE_BG: Record<ContentCategory, string> = {
  FOOD: "linear-gradient(160deg, oklch(0.955 0.035 32), oklch(0.925 0.055 26))",
  FESTIVAL:
    "linear-gradient(160deg, oklch(0.955 0.035 12), oklch(0.925 0.055 6))",
  ATTRACTION:
    "linear-gradient(160deg, oklch(0.95 0.03 220), oklch(0.92 0.05 228))",
  CULTURE:
    "linear-gradient(160deg, oklch(0.955 0.03 60), oklch(0.925 0.05 52))",
  NATURE:
    "linear-gradient(160deg, oklch(0.95 0.035 155), oklch(0.915 0.055 160))",
  EXPERIENCE:
    "linear-gradient(160deg, oklch(0.95 0.03 300), oklch(0.92 0.05 305))",
};
const TILE_FG: Record<ContentCategory, string> = {
  FOOD: "oklch(0.48 0.13 28)",
  FESTIVAL: "oklch(0.48 0.14 12)",
  ATTRACTION: "oklch(0.44 0.09 225)",
  CULTURE: "oklch(0.45 0.09 52)",
  NATURE: "oklch(0.42 0.09 158)",
  EXPERIENCE: "oklch(0.44 0.1 302)",
};
const NEUTRAL_TILE =
  "linear-gradient(160deg, oklch(0.955 0.008 30), oklch(0.925 0.012 30))";
const NEUTRAL_FG = "oklch(0.45 0.015 30)";

const CHIPS: ChipKey[] = ["ALL", ...CONTENT_CATEGORY_ORDER];

function chipLabel(key: ChipKey): string {
  return key === "ALL" ? "전체" : CATEGORY_LABELS[key];
}

export function TryItGallery({ initialContents }: TryItGalleryProps) {
  const { items, add, remove } = useBasket();
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
            <TryItCard
              key={content.id}
              content={content}
              inBasket={items.some((i) => i.content.id === content.id)}
              onAdd={() => add(content)}
              onRemove={() => remove(content.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function TryItCard({
  content,
  inBasket,
  onAdd,
  onRemove,
}: {
  content: Content;
  inBasket: boolean;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const category = content.category;
  const tileBg = category ? TILE_BG[category] : NEUTRAL_TILE;
  const tileFg = category ? TILE_FG[category] : NEUTRAL_FG;

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-[22px] border bg-white transition-all hover:-translate-y-1 hover:shadow-xl ${
        inBasket ? "border-primary/40" : "border-border"
      }`}
    >
      <div
        className="relative grid h-[150px] place-items-center"
        style={{ background: tileBg }}
      >
        <span
          className="grid h-[58px] w-[58px] place-items-center rounded-full bg-white shadow-[0_0_0_1px_oklch(0.91_0.03_30),0_0_0_8px_oklch(1_0_0_/_0.55)]"
          style={{ color: tileFg }}
        >
          <Icon
            name={category ? CATEGORY_ICONS[category] : "map-outline"}
            size={26}
          />
        </span>
        {category && (
          <span
            className="absolute top-2.5 left-2.5 rounded-full bg-white/90 px-2.5 py-1 text-[10.5px] font-extrabold"
            style={{ color: tileFg }}
          >
            {CATEGORY_LABELS[category]}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4.5">
        <p className="text-[15px] leading-snug font-bold tracking-tight">
          {content.name}
        </p>
        <p className="mt-1.5 truncate text-xs text-muted-foreground">
          {content.address}
        </p>
        <button
          type="button"
          onClick={inBasket ? onRemove : onAdd}
          className={`mt-4 w-full rounded-xl py-2.5 text-[13px] font-bold transition-colors ${
            inBasket
              ? "bg-primary text-primary-foreground"
              : "bg-[oklch(0.955_0.04_30)] text-primary"
          }`}
        >
          {inBasket ? "✓ 담았어요" : "담기"}
        </button>
      </div>
    </div>
  );
}
