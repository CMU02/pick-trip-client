"use client";

import Link from "next/link";

import { useAuth } from "@/hooks/useAuth";
import { useBasket } from "@/hooks/useBasket";
import { useSavedItineraries } from "@/hooks/useSavedItineraries";

import { DashStats } from "./DashStats";
import {
  computeStepStatuses,
  currentStepNumber,
  ProgressStepper,
} from "./ProgressStepper";

export function DashboardHero() {
  const { user } = useAuth();
  const { items: basketItems } = useBasket();
  const { items: savedItems } = useSavedItineraries();
  const statuses = computeStepStatuses(basketItems.length, savedItems.length);
  const stepNow = currentStepNumber(statuses);

  const basketCardTitle =
    basketItems.length === 0
      ? "아직 담긴 콘텐츠가 없어요"
      : `콘텐츠 ${basketItems.length}개를 담았어요`;
  const basketCardDesc =
    basketItems.length === 0
      ? "마음에 드는 콘텐츠를 담아 나만의 일정을 만들어보세요"
      : "지금 바로 AI 일정을 만들어볼 수 있어요";

  return (
    <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[oklch(0.63_0.2_30)] to-[oklch(0.53_0.2_16)] p-8 text-white">
        <div className="absolute -right-[60px] -bottom-[90px] h-[250px] w-[250px] rounded-full bg-white/10" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.18] px-3 py-1.5 text-[11.5px] font-bold">
            여행 준비 {stepNow}단계
          </span>
          <h1 className="mt-4 text-[32px] font-extrabold tracking-tight">
            안녕하세요, {user?.nickname}님 👋
          </h1>
          <p className="mt-1.5 text-[14.5px] text-white/[0.82]">
            지금까지의 여행 준비 상황을 확인해보세요
          </p>
          <ProgressStepper />
        </div>
      </div>

      <div className="grid grid-rows-[auto_1fr] gap-3.5">
        <DashStats />
        <div className="flex flex-col justify-between rounded-[20px] border-[1.5px] border-[oklch(0.91_0.05_30)] bg-gradient-to-b from-[oklch(0.985_0.018_30)] to-white p-6">
          <div>
            <p className="text-[16.5px] font-extrabold tracking-tight">
              {basketCardTitle}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {basketCardDesc}
            </p>
          </div>
          <Link
            href="/explore"
            className="mt-4 block w-full rounded-xl bg-primary py-3.5 text-center text-[14.5px] font-bold text-primary-foreground shadow-[0_6px_18px_oklch(0.6_0.19_28/0.3)] transition-colors hover:bg-primary/90"
          >
            콘텐츠 둘러보기 →
          </Link>
        </div>
      </div>
    </section>
  );
}
