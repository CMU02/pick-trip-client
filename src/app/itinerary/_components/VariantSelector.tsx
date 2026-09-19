"use client";

import type { ReactElement } from "react";
import { useEffect, useState } from "react";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import {
  type ItineraryVariant,
  type ItineraryVariantMetrics,
  TRAVEL_MODE_LABELS,
} from "@/types/itinerary";

interface VariantSelectorProps {
  variants: ItineraryVariant[];
  onSelect: (index: number) => void;
  // 닫기 버튼·배경 클릭·Escape로 선택을 취소하고 조건을 다시 만지러 간다.
  onClose: () => void;
}

type MetricKey = Exclude<keyof ItineraryVariantMetrics, "unavailableReasons">;

// 산출 불가 사유 코드 → 사용자에게 보여줄 한국어 문장.
// pick-trip-server 저장소 .agents/docs/api-endpoints.md 기준.
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

// TravelMode는 CAR/TRANSIT 2가지뿐이라 카드 헤더에 쓸 아이콘을 이 파일 안에서만
// 간단한 인라인 SVG로 둔다 — 다른 화면에서 쓸 일이 없어 공용 Icon에 얹지 않는다.
function CarIcon() {
  return (
    <svg
      width="33"
      height="33"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 11l1.4-4.2A2 2 0 0 1 8.3 5.4h7.4a2 2 0 0 1 1.9 1.4L19 11" />
      <rect x="3" y="11" width="18" height="6.2" rx="2.2" />
      <circle cx="7.5" cy="17.4" r="1.3" />
      <circle cx="16.5" cy="17.4" r="1.3" />
    </svg>
  );
}

function TransitIcon() {
  return (
    <svg
      width="33"
      height="33"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4.5" y="3.5" width="15" height="14" rx="2.5" />
      <path d="M4.5 11.5h15" />
      <path d="M8 7.5h8" />
      <circle cx="8.2" cy="18.3" r="1.2" />
      <circle cx="15.8" cy="18.3" r="1.2" />
    </svg>
  );
}

const TRAVEL_MODE_ICONS = {
  CAR: CarIcon,
  TRANSIT: TransitIcon,
} satisfies Record<ItineraryVariant["travelMode"], () => ReactElement>;

// 이동수단별 일정안(variants)을 화면 정중앙에 카드로 띄우고, 사용자가 표를 보고
// 하나를 골라 확정하게 한다. 배경은 짙게 죽여(모달처럼) 카드에만 시선이 모이게
// 하고, 커서를 올린 카드는 한 번 더 밝게 강조하고 반대쪽은 한층 더 흐리게 죽인다.
// 실제 확정은 클릭으로만 일어난다(호버는 미리보기일 뿐). 안이 1개뿐이면(옵션
// 미지정 시 기본) 호출하는 쪽에서 이 컴포넌트를 그리지 않는다.
export function VariantSelector({
  variants,
  onSelect,
  onClose,
}: VariantSelectorProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // 비교할 안이 1개뿐이면 호출부가 이미 이 컴포넌트를 그리지 않지만, 방어적으로
  // 한 번 더 막는다(예전 VariantTabs가 갖고 있던 가드).
  if (variants.length <= 1) return null;

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: 배경 클릭 닫기는 보조 동선이고, 키보드는 Escape로 이미 지원한다
    // biome-ignore lint/a11y/noStaticElementInteractions: 위와 같은 이유
    <div
      data-testid="variant-selector-overlay"
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={(e) => {
          // 배경 onClick과 중복 호출되지 않게 버블링을 막는다.
          e.stopPropagation();
          onClose();
        }}
        aria-label="닫기"
        className="fixed top-6 right-6 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
      >
        <Icon name="close" size={20} />
      </button>

      {/* biome-ignore lint/a11y/useKeyWithClickEvents: 배경 클릭이 카드까지 닫지 않게 막는 용도일 뿐, 그 자체는 상호작용이 아니다 */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: 위와 같은 이유 */}
      <div
        className="my-auto flex w-full max-w-[1152px] flex-col items-center gap-9 py-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <p className="text-2xl font-bold tracking-tight text-white">
            어떤 루트로 일정을 만들까요?
          </p>
          <p className="mt-2 text-sm text-white/70">
            비교해보고 원하는 안을 선택해주세요
          </p>
        </div>

        <div className="flex w-full flex-col items-center justify-center gap-10.5 sm:flex-row sm:items-stretch">
          {variants.map((variant, index) => {
            const isHovered = hoveredIndex === index;
            const isDimmed = hoveredIndex !== null && !isHovered;
            const ModeIcon = TRAVEL_MODE_ICONS[variant.travelMode];

            return (
              <button
                key={variant.travelMode}
                type="button"
                onClick={() => onSelect(index)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onFocus={() => setHoveredIndex(index)}
                onBlur={() => setHoveredIndex(null)}
                aria-label={variant.label}
                className={cn(
                  "flex w-full flex-col overflow-hidden rounded-[42px] border border-white/10 bg-card text-left shadow-[0_20px_45px_-20px_rgba(0,0,0,0.6)] transition-all duration-300 ease-out sm:w-[450px]",
                  isHovered &&
                    "-translate-y-1.5 scale-[1.05] shadow-[0_0_0_4px_oklch(0.64_0.19_32_/_0.35),0_30px_60px_-20px_oklch(0.56_0.2_20_/_0.55)]",
                  isDimmed && "scale-[0.95] opacity-35",
                )}
              >
                <div className="flex items-center gap-4.5 bg-gradient-to-br from-[oklch(0.68_0.19_32)] to-[oklch(0.56_0.2_20)] px-9 py-7.5 text-white">
                  <span className="flex h-15 w-15 shrink-0 items-center justify-center rounded-full bg-white/20">
                    <ModeIcon />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[17.25px] font-bold tracking-wide text-white/80">
                      {TRAVEL_MODE_LABELS[variant.travelMode]}
                    </p>
                    <p className="truncate text-[25.5px] font-bold tracking-tight">
                      {variant.label}
                    </p>
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-3.75 px-9 py-7.5">
                  {METRIC_ROWS.map((row) => {
                    const value = variant.metrics[row.key];
                    if (value === null) {
                      const reasonCode =
                        variant.metrics.unavailableReasons[row.key];
                      const reasonLabel = reasonCode
                        ? UNAVAILABLE_REASON_LABELS[reasonCode]
                        : undefined;
                      return (
                        <div
                          key={row.key}
                          className="flex items-center justify-between border-b border-[oklch(0.95_0.008_30)] pb-3.75 last:border-0 last:pb-0"
                        >
                          <span className="text-[19.5px] text-muted-foreground">
                            {row.label}
                          </span>
                          <span
                            className="text-[19.5px] text-muted-foreground"
                            title={reasonLabel}
                          >
                            산출 불가
                          </span>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={row.key}
                        className="flex items-center justify-between border-b border-[oklch(0.95_0.008_30)] pb-3.75 last:border-0 last:pb-0"
                      >
                        <span className="text-[19.5px] text-muted-foreground">
                          {row.label}
                        </span>
                        <span className="text-[21.75px] font-bold text-foreground">
                          {row.format(value)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div
                  className={cn(
                    "px-9 py-5.25 text-center text-[19.5px] font-bold transition-colors duration-300",
                    isHovered
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/60 text-muted-foreground",
                  )}
                >
                  {/* 왼쪽부터 A안·B안·... — 이동수단 이름과 별개로 카드 위치를
                      가리키는 표기라 인덱스 기준으로 붙인다. */}
                  {String.fromCharCode(65 + index)}안
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
