"use client";

import Link from "next/link";

import { RecommendedCard } from "@/components/RecommendedCard";
import { useAuth } from "@/hooks/useAuth";
import { useBasket } from "@/hooks/useBasket";
import type { Content } from "@/types/content";

import type { QuickCategory } from "./QuickCategoryRow";

const MAX_ITEMS = 8;

interface ForYouSectionProps {
  recommendedPool: Content[];
  // 대시보드 퀵 카테고리 선택과 연동되는 필터. 지정하지 않으면 전체 노출.
  category?: QuickCategory;
}

export function ForYouSection({
  recommendedPool,
  category = "ALL",
}: ForYouSectionProps) {
  const { user } = useAuth();
  const { items: basketItems } = useBasket();

  // basketItems를 직접 구독해 파생값을 계산한다(isInBasket(id) 직접 호출 시
  // React Compiler가 메모이제이션해 상태 변경이 반영되지 않는 문제가 있다).
  const basketIds = new Set(basketItems.map((item) => item.content.id));
  const available = recommendedPool
    .filter((content) => !basketIds.has(content.id))
    .filter((content) => category === "ALL" || content.category === category);
  const recommended = available.slice(0, MAX_ITEMS);

  if (recommended.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="h-[19px] w-1 rounded-full bg-primary" />
            <h2 className="text-[21px] font-bold tracking-tight text-foreground">
              {user?.nickname}님을 위한 추천
            </h2>
            <p className="text-xs font-semibold tracking-wide text-primary/60 uppercase">
              For You
            </p>
          </div>
          <p className="mt-1.5 ml-3.5 text-sm text-muted-foreground">
            최근 본 장소와 가까운 콘텐츠를 모았어요
          </p>
        </div>
        {available.length > MAX_ITEMS && (
          <Link
            href="/dashboard/for-you"
            className="text-sm font-bold text-primary hover:underline"
          >
            더보기 →
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {recommended.map((content) => (
          <RecommendedCard key={content.id} content={content} />
        ))}
      </div>
    </section>
  );
}
