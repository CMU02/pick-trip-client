"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useBasket } from "@/hooks/useBasket";
import {
  type CompanionCondition,
  DURATION_PRESETS,
  type TravelDuration,
} from "@/types/travel-condition";

import { CompanionSelector } from "./CompanionSelector";
import { DurationSelector } from "./DurationSelector";
import { StartDateInput } from "./StartDateInput";

interface TravelDateFormProps {
  regions: string;
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
  const [customNights, setCustomNights] = useState(0);
  const [companions, setCompanions] = useState<CompanionCondition[]>([]);

  function resolveNights(): number {
    if (!duration) return -1;
    if (duration !== "CUSTOM") {
      return DURATION_PRESETS.find((p) => p.value === duration)?.nights ?? -1;
    }
    return customNights;
  }

  const nights = resolveNights();
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

  return (
    <div className="flex flex-col gap-6">
      <StartDateInput value={startDate} onChange={setStartDate} />
      <DurationSelector
        value={duration}
        customNights={customNights}
        onSelect={setDuration}
        onCustomNightsChange={setCustomNights}
      />

      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium">동행 조건</p>
        <CompanionSelector value={companions} onChange={setCompanions} />
        <p className="text-xs text-muted-foreground">선택하지 않아도 됩니다</p>
      </div>

      {isValid && (
        <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-700">
          {startDate} 출발 ·{" "}
          {nights === 0 ? "당일치기" : `${nights}박 ${nights + 1}일`}
          {companions.length > 0 && ` · 동행 조건 ${companions.length}개`}
        </div>
      )}

      <Button
        size="lg"
        disabled={!isValid}
        onClick={handleNext}
        className="mt-2 w-full sm:w-auto sm:self-end"
      >
        다음
      </Button>
    </div>
  );
}
