import type { Metadata } from "next";
import Link from "next/link";

import { FaqAccordion } from "./_components/FaqAccordion";
import { FaqSidebar } from "./_components/FaqSidebar";
import { buildFaqJsonLd } from "./_lib/faqs";

export const metadata: Metadata = {
  title: "자주 묻는 질문 | PickTrip",
  description:
    "PickTrip 이용, AI 일정 생성, 콘텐츠 정보, 계정에 대해 자주 묻는 질문과 답변을 모았습니다.",
};

export default function FaqPage() {
  const jsonLd = buildFaqJsonLd();

  return (
    <main className="mx-auto w-full max-w-[1180px] px-9 pt-[34px] pb-20">
      {/* JSON-LD FAQPage. 정적 배열을 직렬화한 문자열이라 사용자 입력이 없다. */}
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>

      <nav
        aria-label="현재 위치"
        className="text-[12.5px] text-[oklch(0.55_0.015_30)]"
      >
        <Link href="/" className="transition-colors hover:text-primary">
          홈
        </Link>
        <span className="mx-1.5" aria-hidden="true">
          ›
        </span>
        <span className="text-foreground">자주 묻는 질문</span>
      </nav>

      <div className="mt-8 grid items-start gap-[26px] lg:grid-cols-[1fr_320px]">
        <div>
          <h1 className="font-heading text-[34px] font-extrabold tracking-[-0.045em] text-foreground">
            자주 묻는 질문
          </h1>
          <p className="mt-3 text-[14.5px] leading-[1.7] text-[oklch(0.48_0.015_30)]">
            PickTrip 이용 중 자주 나오는 질문을 모았습니다. 찾는 답이 없으면
            서비스 문의하기를 이용해주세요.
          </p>

          <div className="mt-7">
            <FaqAccordion />
          </div>
        </div>

        <FaqSidebar />
      </div>
    </main>
  );
}
