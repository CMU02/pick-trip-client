"use client";

import Link from "next/link";

import { RecommendedCard } from "@/components/RecommendedCard";
import { useAuth } from "@/hooks/useAuth";
import { useBasket } from "@/hooks/useBasket";
import type { Content } from "@/types/content";

const MAX_ITEMS = 8;

interface ForYouSectionProps {
  recommendedPool: Content[];
}

export function ForYouSection({ recommendedPool }: ForYouSectionProps) {
  const { user } = useAuth();
  const { items: basketItems } = useBasket();

  // basketItems를 직접 구독해 파생값을 계산한다(isInBasket(id) 직접 호출 시
  // React Compiler가 메모이제이션해 상태 변경이 반영되지 않는 문제가 있다).
  const basketIds = new Set(basketItems.map((item) => item.content.id));
  const available = recommendedPool.filter(
    (content) => !basketIds.has(content.id),
  );
  const recommended = available.slice(0, MAX_ITEMS);

  if (recommended.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wide text-primary uppercase">
            For You
          </p>
          <h2 className="text-lg font-bold text-foreground">
            {user?.nickname}님을 위한 추천
          </h2>
        </div>
        {available.length > MAX_ITEMS && (
          <Link
            href="/dashboard/for-you"
            className="text-sm text-muted-foreground hover:text-foreground"
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
