import Link from "next/link";

import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="border-t border-border bg-accent/40">
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          아직 무엇을 담을지 고민 중이신가요?
        </h2>
        <p className="mt-2 text-muted-foreground">
          콘텐츠부터 골라도 좋고, 지역만 정했다면 AI 일정으로 바로 가도 좋아요
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/select">콘텐츠부터 골라보기</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/itinerary">AI 일정으로 바로가기</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
