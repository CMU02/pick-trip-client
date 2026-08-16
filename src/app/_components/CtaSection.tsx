import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ALL_REGIONS_QUERY } from "@/types/region";

export function CtaSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="rounded-3xl bg-gradient-to-br from-[oklch(0.63_0.2_30)] to-[oklch(0.53_0.2_16)] p-12 text-center text-white">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          아직 무엇을 담을지 고민 중이신가요?
        </h2>
        <p className="mt-3 text-white/85">
          콘텐츠부터 골라도 좋고, 지역만 정했다면 AI 일정으로 바로 가도 좋아요
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="bg-white text-primary hover:bg-white/90"
          >
            <Link href="/explore">콘텐츠부터 보기</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/50 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            <Link href={`/select/conditions?regions=${ALL_REGIONS_QUERY}`}>
              AI 일정으로 바로가기
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
