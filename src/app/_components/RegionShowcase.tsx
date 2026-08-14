import Link from "next/link";

import {
  REGION_COLORS,
  REGION_DESCRIPTIONS,
  REGION_LABELS,
  REGIONS,
} from "@/types/region";

export function RegionShowcase() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          어디부터 둘러볼까요?
        </h2>
        <p className="mt-2 text-muted-foreground">
          지역을 선택하면 바로 여행 조건 입력으로 이동해요
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-3">
        {REGIONS.map((region) => (
          <Link
            key={region}
            href={`/select/conditions?regions=${region}`}
            className="group block overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
          >
            <div
              aria-hidden="true"
              className="h-37.5"
              style={{
                background:
                  "repeating-linear-gradient(45deg, oklch(0.93 0.028 30) 0 8px, oklch(0.965 0.014 30) 8px 16px)",
              }}
            />
            <div className="p-5">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-block h-1.5 w-6.5 rounded-full"
                  style={{ backgroundColor: REGION_COLORS[region] }}
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
                일정 만들기 →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
