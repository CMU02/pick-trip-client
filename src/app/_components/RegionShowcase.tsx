import Link from "next/link";

import { ContentImage } from "@/components/ContentImage";
import {
  REGION_DESCRIPTIONS,
  REGION_IMAGE_URLS,
  REGION_LABELS,
  REGIONS,
} from "@/types/region";

// 지역 카드를 누르면 그 지역만 필터링된 콘텐츠 탐색(/explore)으로 간다.
export function RegionShowcase() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          어디부터 둘러볼까요?
        </h2>
        <p className="mt-2 text-muted-foreground">
          지역을 선택하면 그 지역의 여행 콘텐츠를 둘러볼 수 있어요
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-3">
        {REGIONS.map((region) => (
          <Link
            key={region}
            href={`/explore?region=${region}`}
            className="group block overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
          >
            <div className="relative aspect-[4/3] bg-muted">
              <ContentImage
                src={REGION_IMAGE_URLS[region]}
                alt={`${REGION_LABELS[region]} 대표 사진`}
                size="lg"
                sizes="(max-width: 640px) 100vw, 33vw"
              />
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-block h-1.5 w-6.5 rounded-full bg-primary"
                />
                <span className="text-[11px] font-extrabold tracking-widest text-muted-foreground">
                  {region}
                </span>
              </div>
              <div className="mt-2.5 text-xl font-bold tracking-tight">
                {REGION_LABELS[region]}
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {REGION_DESCRIPTIONS[region]}
              </p>
              <div className="mt-4 text-sm font-bold text-primary">
                둘러보기 →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
