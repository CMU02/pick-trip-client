import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ALL_REGIONS_QUERY } from "@/types/region";

interface HeroSectionProps {
  // 실제 콘텐츠 총 개수. 서버에서 조회해 전달하며, 조회 실패 시 null로
  // 넘어와 지표를 숨긴다(하드코딩된 값으로 대체하지 않는다).
  contentCount: number | null;
}

const MOSAIC_PLACEHOLDERS = [
  { label: "하동 차밭 사진", hue: 30 },
  { label: "영주 부석사", hue: 150 },
  { label: "예천 회룡포", hue: 240 },
] as const;

function stripeBackground(hue: number) {
  return {
    background: `repeating-linear-gradient(45deg, oklch(0.93 0.025 ${hue}) 0 8px, oklch(0.97 0.012 ${hue}) 8px 16px)`,
  };
}

export function HeroSection({ contentCount }: HeroSectionProps) {
  const heroStats = [
    { value: "3곳", label: "경상도 소도시" },
    {
      value: contentCount !== null ? `${contentCount}개` : "-",
      label: "여행 콘텐츠",
    },
    { value: "30초", label: "AI 일정 생성" },
  ] as const;

  return (
    <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-[oklch(0.985_0.02_30)] to-white">
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-20 sm:py-28 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-[11.5px] font-extrabold tracking-widest text-primary-foreground">
            PICK TRIP
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            하동, 영주, 예천
            <br />
            내가 고른 콘텐츠로
            <br />
            만드는 <span className="text-primary">나만의 일정</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
            경상도 소도시의 여행 콘텐츠를 둘러보고 마음에 드는 것만 골라 담으면,
            AI가 현실적인 여행 일정을 짜드려요.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/explore">콘텐츠 둘러보기</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={`/select/conditions?regions=${ALL_REGIONS_QUERY}`}>
                AI 일정 살펴보기
              </Link>
            </Button>
          </div>
          <div className="mt-9 flex gap-7">
            {heroStats.map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-extrabold tracking-tight text-primary">
                  {stat.value}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 grid-rows-[150px_150px_150px] gap-3">
          <div
            aria-hidden="true"
            style={stripeBackground(MOSAIC_PLACEHOLDERS[0].hue)}
            className="col-start-1 row-span-2 row-start-1 rounded-2xl"
          />
          <div
            aria-hidden="true"
            style={stripeBackground(MOSAIC_PLACEHOLDERS[1].hue)}
            className="rounded-2xl"
          />
          <div
            aria-hidden="true"
            style={stripeBackground(MOSAIC_PLACEHOLDERS[2].hue)}
            className="col-start-2 row-span-2 row-start-2 rounded-2xl"
          />
          <div className="flex flex-col justify-between rounded-2xl bg-primary p-4.5 text-primary-foreground">
            <div className="text-xs font-bold opacity-85">AI 일정</div>
            <div className="text-lg leading-tight font-bold tracking-tight">
              1박 2일
              <br />
              코스 완성
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
