import Link from "next/link";

import { ALL_REGIONS_QUERY } from "@/types/region";

import { HeroSlider } from "./HeroSlider";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-[oklch(0.94_0.012_30)] bg-[oklch(0.98_0.012_32)]">
      <div className="relative z-10 mx-auto max-w-[1240px] px-6 pt-16 text-center sm:px-10">
        <span className="inline-block rounded-full bg-[oklch(0.5_0.19_28)] px-3.5 py-1.5 text-[11.5px] font-extrabold tracking-[0.16em] text-white">
          PICK TRIP
        </span>
        <h1 className="mx-auto mt-5 max-w-[760px] text-[32px] leading-[1.16] font-extrabold tracking-[-0.05em] text-balance sm:text-[46px]">
          하동, 영주, 예천 내가 고른 콘텐츠로
          <br />
          만드는 <span className="text-[oklch(0.5_0.19_28)]">나만의 일정</span>
        </h1>
        <p className="mx-auto mt-5 max-w-[680px] text-base leading-[1.66] tracking-[-0.02em] text-[oklch(0.42_0.016_30)] text-balance sm:text-lg">
          경상도 소도시의 여행 콘텐츠를 둘러보고 마음에 드는 것만 골라 담으면,
          <br className="hidden sm:block" />
          AI가 현실적인 여행 일정을 짜드려요.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
          <Link
            href="/explore"
            className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[oklch(0.5_0.19_28)] px-8.5 text-[17px] font-extrabold tracking-[-0.02em] text-white shadow-[0_12px_26px_oklch(0.5_0.19_28_/_0.34)] transition-colors hover:bg-[oklch(0.44_0.19_28)] sm:h-[58px] sm:w-auto"
          >
            콘텐츠 둘러보기
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M7 4v16l11-8z" />
            </svg>
          </Link>
          <Link
            href={`/select/conditions?regions=${ALL_REGIONS_QUERY}`}
            className="flex h-13 w-full items-center justify-center rounded-2xl border-2 border-[oklch(0.5_0.19_28)] bg-white px-7.5 text-[17px] font-extrabold tracking-[-0.02em] text-[oklch(0.44_0.19_28)] shadow-[0_8px_20px_oklch(0.4_0.03_30_/_0.1)] transition-colors hover:bg-[oklch(0.97_0.02_30)] sm:h-[58px] sm:w-auto"
          >
            AI 일정 살펴보기
          </Link>
        </div>
      </div>

      <HeroSlider />
    </section>
  );
}
