"use client";

import { useRouter } from "next/navigation";

import { useBasket } from "@/hooks/useBasket";
import { useFavorites } from "@/hooks/useFavorites";
import { useSavedItineraries } from "@/hooks/useSavedItineraries";

// 핸드오프 스펙의 dashStats(담은 콘텐츠/찜한 장소/저장한 일정) 3개 통계 카드.
// 프로토타입의 클릭 대상(go('contents')/go('favorites')/go('itineraries'))을
// 실제 라우트로 매핑한다 — "담은 콘텐츠"는 바구니 전용 화면이 없어 콘텐츠를
// 담을 수 있는 /explore로 연결한다.
const STATS = [
  { key: "basket", label: "담은 콘텐츠", href: "/explore" },
  { key: "favorites", label: "찜한 장소", href: "/favorites" },
  { key: "saved", label: "저장한 일정", href: "/itineraries" },
] as const;

export function DashStats() {
  const router = useRouter();
  const { items: basketItems } = useBasket();
  const { items: favoriteItems } = useFavorites();
  const { items: savedItems } = useSavedItineraries();

  const values: Record<(typeof STATS)[number]["key"], number> = {
    basket: basketItems.length,
    favorites: favoriteItems.length,
    saved: savedItems.length,
  };

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {STATS.map((stat) => (
        <button
          key={stat.key}
          type="button"
          onClick={() => router.push(stat.href)}
          className="rounded-2xl border border-border bg-[oklch(0.985_0.008_30)] p-3.5 text-left transition-colors hover:border-primary/40"
        >
          <div className="text-2xl font-extrabold tracking-tight text-[oklch(0.58_0.19_28)]">
            {values[stat.key]}
          </div>
          <div className="mt-0.5 text-xs font-semibold text-muted-foreground">
            {stat.label}
          </div>
        </button>
      ))}
    </div>
  );
}
