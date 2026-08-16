"use client";

import { useBasket } from "@/hooks/useBasket";
import { useSavedItineraries } from "@/hooks/useSavedItineraries";
import { cn } from "@/lib/utils";

export type StepStatus = "done" | "current" | "upcoming";

const STEPS = [
  { key: "region", label: "지역 선택" },
  { key: "contents", label: "콘텐츠 담기" },
  { key: "itinerary", label: "일정 완성" },
] as const;

const STATUS_LABELS: Record<StepStatus, string> = {
  done: "완료",
  current: "진행중",
  upcoming: "예정",
};

// 바구니/저장된 일정 상태로 3단계 진행 상태를 자동 판단한다.
// - 저장된 일정 1개 이상: 전부 완료
// - 바구니 2개 이상(일정 생성 가능 기준): ①②완료, ③진행중
// - 바구니 1개: ①완료, ②진행중, ③예정
// - 바구니 0개: ①진행중, ②③예정
export function computeStepStatuses(
  basketCount: number,
  savedCount: number,
): StepStatus[] {
  if (savedCount >= 1) return ["done", "done", "done"];
  if (basketCount >= 2) return ["done", "done", "current"];
  if (basketCount >= 1) return ["done", "current", "upcoming"];
  return ["current", "upcoming", "upcoming"];
}

// 현재 진행 단계 번호(1~3). 히어로의 "여행 준비 N단계" 배지가 재사용한다.
export function currentStepNumber(statuses: StepStatus[]): number {
  const idx = statuses.indexOf("upcoming");
  return idx === -1 ? STEPS.length : idx;
}

export function ProgressStepper() {
  const { items: basketItems } = useBasket();
  const { items: savedItems } = useSavedItineraries();
  const statuses = computeStepStatuses(basketItems.length, savedItems.length);

  return (
    <ol className="mt-6 grid grid-cols-3 gap-2.5">
      {STEPS.map((step, i) => {
        const status = statuses[i];
        // 핸드오프 스펙: 진행중 단계도 "도달한 단계"로 취급해 완료와 같은
        // 카드 스타일(흰 카드+코랄 번호+코랄 바)을 쓰고, 예정 단계만 반투명으로 남긴다.
        const reached = status !== "upcoming";
        return (
          <li
            key={step.key}
            aria-label={`${step.label}: ${STATUS_LABELS[status]}`}
            className={cn(
              "rounded-[14px] px-3.5 py-3",
              reached
                ? "bg-white text-[#2B2523]"
                : "bg-white/[0.14] text-white/90",
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-[21px] w-[21px] shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold",
                  reached
                    ? "bg-primary text-primary-foreground"
                    : "bg-white/28 text-white",
                )}
              >
                {status === "done" ? "✓" : i + 1}
              </span>
              <span className="text-[13px] font-bold">{step.label}</span>
            </div>
            <div
              className={cn(
                "mt-2.5 h-1 rounded-full",
                reached ? "bg-primary" : "bg-white/25",
              )}
            />
          </li>
        );
      })}
    </ol>
  );
}
