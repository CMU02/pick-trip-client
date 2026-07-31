"use client";

import { Icon } from "@/components/ui/icon";
import { useBasket } from "@/hooks/useBasket";
import { useSavedItineraries } from "@/hooks/useSavedItineraries";
import { cn } from "@/lib/utils";

type StepStatus = "done" | "current" | "upcoming";

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
function computeStepStatuses(
  basketCount: number,
  savedCount: number,
): StepStatus[] {
  if (savedCount >= 1) return ["done", "done", "done"];
  if (basketCount >= 2) return ["done", "done", "current"];
  if (basketCount >= 1) return ["done", "current", "upcoming"];
  return ["current", "upcoming", "upcoming"];
}

export function ProgressStepper() {
  const { items: basketItems } = useBasket();
  const { items: savedItems } = useSavedItineraries();
  const statuses = computeStepStatuses(basketItems.length, savedItems.length);

  return (
    <ol className="flex items-center gap-2">
      {STEPS.map((step, i) => {
        const status = statuses[i];
        return (
          <li
            key={step.key}
            aria-label={`${step.label}: ${STATUS_LABELS[status]}`}
            className="flex flex-1 items-center gap-2 last:flex-none"
          >
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                status === "done" && "bg-primary text-primary-foreground",
                status === "current" &&
                  "border-2 border-primary bg-accent text-accent-foreground",
                status === "upcoming" && "bg-muted text-muted-foreground",
              )}
            >
              {status === "done" ? <Icon name="check" size={14} /> : i + 1}
            </span>
            <span
              className={cn(
                "text-sm whitespace-nowrap",
                status === "upcoming"
                  ? "text-muted-foreground"
                  : "font-medium text-foreground",
              )}
            >
              {step.label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1",
                  status === "done" ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
