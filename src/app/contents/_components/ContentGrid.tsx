"use client";

import { BasketLayout } from "@/components/BasketLayout";
import { ContentBrowser } from "@/components/ContentBrowser";
import type { ContentQueryParams } from "@/hooks/useLoadMoreContents";
import { JOURNEY_STEPS } from "@/lib/journey";
import type { Content } from "@/types/content";

import { ContentCard } from "./ContentCard";

interface ContentGridProps {
  initialContents: Content[];
  initialTotal: number;
  queryParams: ContentQueryParams;
  itineraryHref: string;
  conditionLine: string;
}

export function ContentGrid({
  initialContents,
  initialTotal,
  queryParams,
  itineraryHref,
  conditionLine,
}: ContentGridProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-extrabold tracking-widest text-primary/70 uppercase">
          Step {JOURNEY_STEPS[1].n} · {JOURNEY_STEPS[1].label}
        </p>
        <h1 className="mt-2.5 text-[32px] font-extrabold tracking-tight text-foreground">
          마음에 드는 콘텐츠를 담아보세요
        </h1>
        <p className="mt-2 text-[13.5px] text-muted-foreground">
          {conditionLine}
        </p>
      </div>

      <BasketLayout generateHref={itineraryHref}>
        <ContentBrowser
          initialContents={initialContents}
          initialTotal={initialTotal}
          queryParams={queryParams}
          renderCard={(content) => (
            <ContentCard key={content.id} content={content} />
          )}
          gridClassName="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        />
      </BasketLayout>
    </div>
  );
}
