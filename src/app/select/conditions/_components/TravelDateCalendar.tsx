"use client";

import { useState } from "react";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

interface TravelDateCalendarProps {
  value: string; // "YYYY-MM-DD" 또는 빈 문자열
  nights: number; // 선택된 기간(박). 범위 하이라이트 계산에 쓰인다.
  onSelect: (date: string) => void;
  // "출발일" 제목 아래 보여줄 선택 요약 문구("9월 12일 출발 · 1박 2일" 등).
  subtitle: string;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function toDateOnly(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDateKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// 핸드오프 스펙(3번 "지역·조건 선택" ★캘린더)의 달력. 출발일 클릭 시
// nights만큼 범위가 자동으로 하이라이트된다(종료일을 따로 클릭하지 않음).
// 스펙 프로토타입에는 없지만, 기존 <input type="date" min={today}>가 갖고
// 있던 "과거 날짜 선택 불가" 제약은 실제 예약 로직상 유지한다.
export function TravelDateCalendar({
  value,
  nights,
  onSelect,
  subtitle,
}: TravelDateCalendarProps) {
  const today = toDateOnly(new Date());
  const initial = value ? toDateOnly(new Date(value)) : today;
  const [cal, setCal] = useState({
    year: initial.getFullYear(),
    month: initial.getMonth(),
  });

  const start = value ? toDateOnly(new Date(value)) : null;
  const n = Math.max(nights, 0);
  const endTs = start ? start.getTime() + n * 86400000 : null;

  const first = new Date(cal.year, cal.month, 1);
  const startPad = first.getDay();
  const daysIn = new Date(cal.year, cal.month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysIn; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  function goPrevMonth() {
    setCal((c) =>
      c.month === 0
        ? { year: c.year - 1, month: 11 }
        : { year: c.year, month: c.month - 1 },
    );
  }

  function goNextMonth() {
    setCal((c) =>
      c.month === 11
        ? { year: c.year + 1, month: 0 }
        : { year: c.year, month: c.month + 1 },
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-foreground">출발일</div>
          <div className="mt-1 text-[12.5px] text-muted-foreground">
            {subtitle}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={goPrevMonth}
            aria-label="이전 달"
            className="flex h-[34px] w-[34px] items-center justify-center rounded-[11px] border border-border text-muted-foreground transition-colors hover:bg-muted"
          >
            <Icon name="chevron-left" size={16} />
          </button>
          <div className="min-w-[118px] text-center text-[16px] font-bold tracking-tight">
            {cal.year}년 {cal.month + 1}월
          </div>
          <button
            type="button"
            onClick={goNextMonth}
            aria-label="다음 달"
            className="flex h-[34px] w-[34px] items-center justify-center rounded-[11px] border border-border text-muted-foreground transition-colors hover:bg-muted"
          >
            <Icon name="chevron-right" size={16} />
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((label, i) => (
          <div
            key={label}
            className={cn(
              "flex h-[30px] items-center justify-center text-[11.5px] font-bold",
              i === 0 && "text-[oklch(0.6_0.16_25)]",
              i === 6 && "text-[oklch(0.55_0.09_250)]",
              i !== 0 && i !== 6 && "text-muted-foreground",
            )}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((d, idx) => {
          if (d === null) {
            // 월 시작 전 빈 칸: 다른 식별자가 없고 달 전환마다 그리드 전체가
            // 다시 만들어져 순서가 바뀌지 않으므로 인덱스 키를 써도 안전하다.
            // biome-ignore lint/suspicious/noArrayIndexKey: 빈 칸은 다른 식별자가 없음
            return <div key={`blank-${idx}`} className="h-[46px]" />;
          }

          const cur = new Date(cal.year, cal.month, d);
          const ts = cur.getTime();
          const isPast = ts < today.getTime();
          const isStart = start !== null && ts === start.getTime();
          const isEnd = start !== null && n > 0 && ts === endTs;
          const inRange =
            start !== null &&
            ts > start.getTime() &&
            (endTs === null || ts < endTs);
          const dow = idx % 7;

          const radius =
            isStart && isEnd
              ? "12px"
              : isStart
                ? "12px 4px 4px 12px"
                : isEnd
                  ? "4px 12px 12px 4px"
                  : inRange
                    ? "4px"
                    : "12px";

          return (
            <button
              key={formatDateKey(cal.year, cal.month, d)}
              type="button"
              disabled={isPast}
              onClick={() => onSelect(formatDateKey(cal.year, cal.month, d))}
              style={{ borderRadius: radius }}
              className={cn(
                "relative flex h-[46px] items-center justify-center text-sm transition-colors",
                isPast && "cursor-not-allowed text-muted-foreground/40",
                !isPast &&
                  (isStart || isEnd) &&
                  "bg-primary font-bold text-primary-foreground",
                !isPast &&
                  !isStart &&
                  !isEnd &&
                  inRange &&
                  "bg-accent font-bold text-accent-foreground",
                !isPast &&
                  !isStart &&
                  !isEnd &&
                  !inRange &&
                  dow === 0 &&
                  "text-[oklch(0.6_0.16_25)]",
                !isPast &&
                  !isStart &&
                  !isEnd &&
                  !inRange &&
                  dow === 6 &&
                  "text-[oklch(0.55_0.09_250)]",
                !isPast &&
                  !isStart &&
                  !isEnd &&
                  !inRange &&
                  dow !== 0 &&
                  dow !== 6 &&
                  "text-foreground",
              )}
            >
              {d}
              {(isStart || isEnd) && (
                <span className="absolute bottom-[7px] h-1 w-1 rounded-full bg-white/70" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
