import Link from "next/link";

import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="border-b border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:py-28">
        <p className="mb-3 text-xs font-semibold tracking-wide text-primary uppercase">
          Pick Trip
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          하동, 영주, 예천
          <br />
          내가 고른 콘텐츠로 만드는 나만의 일정
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          경상도 소도시의 여행 콘텐츠를 둘러보고 마음에 드는 것만 골라 담으면,
          AI가 현실적인 여행 일정을 짜드려요.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/select">콘텐츠 둘러보기</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/itinerary">AI 일정 살펴보기</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
