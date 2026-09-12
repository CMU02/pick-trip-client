"use client";

import { cn } from "@/lib/utils";
import {
  type ItineraryVariant,
  type ItineraryVariantMetrics,
  TRAVEL_MODE_LABELS,
} from "@/types/itinerary";

interface VariantTabsProps {
  variants: ItineraryVariant[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

type MetricKey = Exclude<keyof ItineraryVariantMetrics, "unavailableReasons">;

// 산출 불가 사유 코드 → 사용자에게 보여줄 한국어 문장.
// .agents/docs/api-endpoints.md(pick-trip-server) 기준.
const UNAVAILABLE_REASON_LABELS: Record<string, string> = {
  UNKNOWN_TRAVEL_DISTANCE: "구간 좌표를 몰라 이동 거리를 잴 수 없었어요",
};

// 45 → "45분", 90 → "1시간 30분", 0 → "0분". formatTravelMinutes(lib/itinerary)와
// 달리 0을 숨기지 않는다 — CAR의 도보 시간처럼 "해당 없음"도 실제 0으로 보여줘야 한다.
function formatMinutesCell(value: number): string {
  if (value === 0) return "0분";
  const hours = Math.floor(value / 60);
  const mins = value % 60;
  if (hours === 0) return `${mins}분`;
  if (mins === 0) return `${hours}시간`;
  return `${hours}시간 ${mins}분`;
}

function formatWonCell(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

const METRIC_ROWS: {
  key: MetricKey;
  label: string;
  format: (value: number) => string;
}[] = [
  { key: "totalTravelMinutes", label: "이동 시간", format: formatMinutesCell },
  { key: "totalWalkingMinutes", label: "도보 시간", format: formatMinutesCell },
  { key: "totalTransitCost", label: "예상 교통비", format: formatWonCell },
  { key: "placeCount", label: "방문 장소", format: (v) => `${v}곳` },
];

// 이동수단별 일정안(variants)을 탭으로 전환하고, 안끼리 비교 지표를 나란히
// 보여준다. 안이 1개뿐이면(옵션 미지정 시 기본) 아무것도 그리지 않아 기존
// 화면과 완전히 동일하게 보인다.
export function VariantTabs({
  variants,
  selectedIndex,
  onSelect,
}: VariantTabsProps) {
  if (variants.length <= 1) return null;

  return (
    <div className="rounded-[16px] border border-border bg-white p-4">
      <div
        role="tablist"
        aria-label="이동수단별 일정안"
        className="flex flex-wrap gap-2"
      >
        {variants.map((variant, index) => {
          const selected = index === selectedIndex;
          return (
            <button
              key={variant.travelMode}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onSelect(index)}
              className={cn(
                "rounded-full border-[1.5px] px-4 py-2 text-[13px] font-bold transition-colors",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40",
              )}
            >
              {variant.label}
            </button>
          );
        })}
      </div>

      <div className="mt-3.5 overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-[13px]">
          <thead>
            <tr>
              <th className="w-28 py-1.5 text-left font-semibold text-muted-foreground">
                <span className="sr-only">비교 지표</span>
              </th>
              {variants.map((variant, index) => (
                <th
                  key={variant.travelMode}
                  className={cn(
                    "py-1.5 text-left font-bold",
                    index === selectedIndex
                      ? "text-primary"
                      : "text-foreground",
                  )}
                >
                  {TRAVEL_MODE_LABELS[variant.travelMode]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRIC_ROWS.map((row) => (
              <tr
                key={row.key}
                className="border-t border-[oklch(0.95_0.008_30)]"
              >
                <th className="py-2 text-left font-semibold text-muted-foreground">
                  {row.label}
                </th>
                {variants.map((variant) => {
                  const value = variant.metrics[row.key];
                  if (value === null) {
                    const reasonCode =
                      variant.metrics.unavailableReasons[row.key];
                    const reasonLabel = reasonCode
                      ? UNAVAILABLE_REASON_LABELS[reasonCode]
                      : undefined;
                    return (
                      <td
                        key={variant.travelMode}
                        className="py-2 text-muted-foreground"
                        title={reasonLabel}
                      >
                        산출 불가
                      </td>
                    );
                  }
                  return (
                    <td key={variant.travelMode} className="py-2 font-semibold">
                      {row.format(value)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
