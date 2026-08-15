"use client";

import { cn } from "@/lib/utils";
import {
  DURATION_PRESETS,
  type TravelDuration,
} from "@/types/travel-condition";

interface DurationSelectorProps {
  value: TravelDuration | null;
  customNights: number;
  onSelect: (duration: TravelDuration) => void;
  onCustomNightsChange: (nights: number) => void;
}

export function DurationSelector({
  value,
  customNights,
  onSelect,
  onCustomNightsChange,
}: DurationSelectorProps) {
  return (
    <div className="mt-5.5 border-t border-[oklch(0.95_0.008_30)] pt-5.5">
      <span className="text-sm font-bold text-foreground">기간</span>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {DURATION_PRESETS.map((preset) => {
          const selected = value === preset.value;
          return (
            <button
              key={preset.value}
              type="button"
              onClick={() => onSelect(preset.value)}
              aria-pressed={selected}
              className={cn(
                "rounded-[13px] border-[1.5px] px-2.5 py-3 text-[13.5px] font-bold transition-all",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-muted/40",
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {value === "CUSTOM" && (
        <div className="mt-3 flex items-center gap-2.5 rounded-[13px] bg-[oklch(0.975_0.012_30)] px-4 py-3">
          <span className="text-[13px] font-semibold text-muted-foreground">
            숙박
          </span>
          <button
            type="button"
            aria-label="숙박 일수 줄이기"
            onClick={() => onCustomNightsChange(Math.max(1, customNights - 1))}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] border border-border bg-card"
          >
            −
          </button>
          <span className="min-w-[52px] text-center text-[16px] font-bold">
            {customNights}박
          </span>
          <button
            type="button"
            aria-label="숙박 일수 늘리기"
            onClick={() => onCustomNightsChange(Math.min(9, customNights + 1))}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] border border-border bg-card"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}
