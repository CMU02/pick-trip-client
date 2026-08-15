"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useBasket } from "@/hooks/useBasket";
import { REGION_LABELS, type Region } from "@/types/region";
import {
  COMPANION_CONDITION_LABELS,
  type CompanionCondition,
  DURATION_PRESETS,
  type TravelDuration,
} from "@/types/travel-condition";

import { CompanionSelector } from "./CompanionSelector";
import { DurationSelector } from "./DurationSelector";
import { TravelDateCalendar } from "./TravelDateCalendar";

interface TravelDateFormProps {
  regions: string;
}

function formatDateLabel(dateStr: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date(dateStr));
}

function formatDuration(nights: number) {
  return nights === 0 ? "당일치기" : `${nights}박 ${nights + 1}일`;
}

export function TravelDateForm({ regions }: TravelDateFormProps) {
  const router = useRouter();
  const { clear } = useBasket();

  // Step2(여행 조건 입력)가 새 여행 계획의 실질적 시작점이므로, 이전 계획에서
  // 남은 바구니를 비운다. 원래 이 책임은 /select(Step1)에 있었으나 해당
  // 페이지가 제거되며 이곳으로 옮겨왔다.
  useEffect(() => {
    clear();
  }, [clear]);

  const [startDate, setStartDate] = useState("");
  const [duration, setDuration] = useState<TravelDuration | null>(null);
  const [customNights, setCustomNights] = useState(1);
  const [companions, setCompanions] = useState<CompanionCondition[]>([]);

  function resolveNights(): number {
    if (!duration) return -1;
    if (duration !== "CUSTOM") {
      return DURATION_PRESETS.find((p) => p.value === duration)?.nights ?? -1;
    }
    return customNights;
  }

  const nights = resolveNights();
  const durationLabel = duration ? formatDuration(nights) : null;

  const isValid =
    startDate !== "" &&
    duration !== null &&
    (duration !== "CUSTOM" || customNights >= 1);

  function handleNext() {
    if (!isValid) return;
    const params = new URLSearchParams({
      regions,
      startDate,
      nights: String(nights),
    });
    if (companions.length > 0) {
      params.set("companions", companions.join(","));
    }
    router.push(`/contents?${params.toString()}`);
  }

  // 지역은 홈 화면 카드 클릭으로 이미 정해져 이 페이지에서는 바꿀 수 없다
  // (핸드오프 문서의 지역 다중 선택 블록은 기존 흐름과 충돌해 반영하지
  // 않기로 확인함). 선택 요약에서 읽기 전용으로만 보여준다.
  const regionLabel = regions
    ? regions
        .split(",")
        .map((r) => REGION_LABELS[r as Region] ?? r)
        .join(", ")
    : "전체";

  const calendarSubtitle = startDate
    ? `${formatDateLabel(startDate)} 출발${durationLabel ? ` · ${durationLabel}` : ""}`
    : "날짜를 선택하세요";

  const summaryRows = [
    { label: "지역", value: regionLabel },
    { label: "날짜", value: startDate ? formatDateLabel(startDate) : "미선택" },
    { label: "기간", value: durationLabel ?? "미선택" },
    {
      label: "동행 조건",
      value: companions.length
        ? companions.map((c) => COMPANION_CONDITION_LABELS[c]).join(", ")
        : "없음",
    },
  ];

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_380px]">
      <div className="flex flex-col gap-5.5">
        <div className="rounded-[20px] border border-border bg-white p-6.5 shadow-[0_1px_2px_oklch(0.5_0.02_30/0.04),0_18px_40px_oklch(0.5_0.02_30/0.05)]">
          <TravelDateCalendar
            value={startDate}
            nights={Math.max(nights, 0)}
            onSelect={setStartDate}
            subtitle={calendarSubtitle}
          />
          <DurationSelector
            value={duration}
            customNights={customNights}
            onSelect={setDuration}
            onCustomNightsChange={setCustomNights}
          />
        </div>

        <div className="rounded-[20px] border border-border bg-white p-6.5">
          <div className="flex items-baseline gap-2">
            <p className="text-sm font-bold text-foreground">동행 조건</p>
            <p className="text-xs text-muted-foreground">
              선택하지 않아도 됩니다
            </p>
          </div>
          <div className="mt-3.5">
            <CompanionSelector value={companions} onChange={setCompanions} />
          </div>
        </div>
      </div>

      <div className="rounded-[20px] border-[1.5px] border-[oklch(0.91_0.05_30)] bg-gradient-to-b from-[oklch(0.985_0.018_30)] to-white p-6 lg:sticky lg:top-[86px]">
        <p className="text-lg font-bold tracking-tight">선택 요약</p>
        <dl className="mt-4 flex flex-col gap-3">
          {summaryRows.map((row) => (
            <div
              key={row.label}
              className="flex items-start justify-between gap-3 text-[13.5px]"
            >
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="text-right font-bold">{row.value}</dd>
            </div>
          ))}
        </dl>
        <button
          type="button"
          disabled={!isValid}
          onClick={handleNext}
          className="mt-5.5 w-full rounded-xl py-3.5 text-[15px] font-bold transition-colors disabled:cursor-not-allowed disabled:bg-[oklch(0.94_0.008_30)] disabled:text-[oklch(0.7_0.01_30)] enabled:bg-primary enabled:text-primary-foreground enabled:shadow-[0_8px_20px_oklch(0.6_0.19_28/0.3)] enabled:hover:bg-primary/90"
        >
          다음
        </button>
        <p className="mt-2.5 text-center text-xs text-muted-foreground">
          {isValid
            ? "콘텐츠 담기로 이동합니다"
            : "지역과 출발일을 선택해주세요"}
        </p>
      </div>
    </div>
  );
}
