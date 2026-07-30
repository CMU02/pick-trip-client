import Link from "next/link";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {REGIONS.map((region) => (
          <Link
            key={region}
            href={`/select/conditions?regions=${region}`}
            className="group block"
          >
            <Card className="h-full transition hover:border-primary/40 hover:shadow-md">
              <CardHeader>
                <span
                  aria-hidden="true"
                  className="mb-2 inline-block h-2 w-10 rounded-full"
                  style={{ backgroundColor: REGION_COLORS[region] }}
                />
                <CardTitle className="text-lg">
                  {REGION_LABELS[region]}
                </CardTitle>
                <CardDescription>{REGION_DESCRIPTIONS[region]}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
