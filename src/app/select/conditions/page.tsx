import type { Metadata } from "next";

import { JOURNEY_STEPS } from "@/lib/journey";

import { TravelDateForm } from "./_components/TravelDateForm";

export const metadata: Metadata = {
  title: "여행 조건 설정",
};

interface ConditionsPageProps {
  searchParams: Promise<{ regions?: string }>;
}

export default async function ConditionsPage({
  searchParams,
}: ConditionsPageProps) {
  const { regions = "" } = await searchParams;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10">
      <div className="mb-8">
        <p className="text-xs font-extrabold tracking-widest text-primary/70 uppercase">
          Step {JOURNEY_STEPS[0].n} · {JOURNEY_STEPS[0].label}
        </p>
        <h1 className="mt-3 text-[36px] font-extrabold tracking-tight">
          언제 떠나볼까요?
        </h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          여행 날짜와 기간을 선택하세요
        </p>
      </div>
      <TravelDateForm regions={regions} />
    </main>
  );
}
