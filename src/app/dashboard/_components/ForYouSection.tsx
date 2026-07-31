"use client";

import { useAuth } from "@/hooks/useAuth";
import { useBasket } from "@/hooks/useBasket";
import type { Content } from "@/types/content";

import { RecommendedCard } from "./RecommendedCard";

const MAX_ITEMS = 8;

interface ForYouSectionProps {
  recommendedPool: Content[];
}

export function ForYouSection({ recommendedPool }: ForYouSectionProps) {
  const { user } = useAuth();
  const { isInBasket } = useBasket();

  const recommended = recommendedPool
    .filter((content) => !isInBasket(content.id))
    .slice(0, MAX_ITEMS);

  if (recommended.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-semibold tracking-wide text-primary uppercase">
          For You
        </p>
        <h2 className="text-lg font-bold text-foreground">
          {user?.nickname}님을 위한 추천
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {recommended.map((content) => (
          <RecommendedCard key={content.id} content={content} />
        ))}
      </div>
    </section>
  );
}
