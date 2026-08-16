"use client";

import { useCallback, useEffect, useState } from "react";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

interface TravelDateCalendarProps {
  value: string; // "YYYY-MM-DD" 또는 빈 문자열
  nights: number; // 선택된 기간(박). 범위 하이라이트 계산에 쓰인다.
  onSelect: (date: string) => void;
  // 출발일을 고른 뒤 그보다 늦은 날짜를 한 번 더 클릭해 도착일을 지정하면
  // 호출된다. 기간 버튼(당일치기/1박2일 등)을 누르지 않고도 달력만으로
  // 기간을 정할 수 있게 한다.
  onSelectRange?: (start: string, nights: number) => void;
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

function dateToKey(date: Date) {
  return formatDateKey(date.getFullYear(), date.getMonth(), date.getDate());
}

// 핸드오프 스펙(3번 "지역·조건 선택" ★캘린더)의 달력. 출발일 클릭 시
// nights만큼 범위가 자동으로 하이라이트된다(종료일을 따로 클릭하지 않음).
// 스펙 프로토타입에는 없지만, 기존 <input type="date" min={today}>가 갖고
// 있던 "과거 날짜 선택 불가" 제약은 실제 예약 로직상 유지한다.
export function TravelDateCalendar({
  value,
  nights,
  onSelect,
  onSelectRange,
  subtitle,
}: TravelDateCalendarProps) {
  const today = toDateOnly(new Date());
  const initial = value ? toDateOnly(new Date(value)) : today;
  const [cal, setCal] = useState({
    year: initial.getFullYear(),
    month: initial.getMonth(),
  });
  // 도착일 클릭을 기다리는 중인 출발일. 두 번째 클릭이 오면 기간을 계산해
  // onSelectRange로 알리고 비운다(다음 클릭은 다시 새 출발일이 된다).
  const [pendingStart, setPendingStart] = useState<string | null>(null);

  // 마우스로 끌어서 범위를 고르는 중인 상태. dragAnchor는 mousedown한
  // 날짜, dragOver는 지금 마우스가 올라가 있는 날짜다(드래그 중 실시간
  // 미리보기용). 둘 다 null이면 드래그 중이 아니다.
  const [dragAnchor, setDragAnchor] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  // 드래그 종료 핸들러(useEffect) 안에서도 최신 버전을 참조해야 해서
  // useCallback으로 감싼다.
  const handleDayClick = useCallback(
    (dateKey: string) => {
      if (!onSelectRange || pendingStart === null) {
        onSelect(dateKey);
        setPendingStart(dateKey);
        return;
      }

      const diffDays = Math.round(
        (toDateOnly(new Date(dateKey)).getTime() -
          toDateOnly(new Date(pendingStart)).getTime()) /
          86400000,
      );

      if (diffDays < 0) {
        // 출발일보다 이른 날짜를 클릭하면 새 출발일로 다시 잡는다.
        onSelect(dateKey);
        setPendingStart(dateKey);
        return;
      }

      onSelectRange(pendingStart, diffDays);
      setPendingStart(null);
    },
    [onSelect, onSelectRange, pendingStart],
  );

  function handleDayMouseDown(dateKey: string) {
    if (toDateOnly(new Date(dateKey)).getTime() < today.getTime()) return;

    // 이미 확정된 범위가 있고(nights > 0) 그 출발일 또는 도착일 마커를
    // 정확히 누른 거라면, 반대쪽 끝을 고정점(dragAnchor)으로 삼아 그
    // 마커만 다시 늘였다 줄였다 할 수 있게 한다(양쪽 핸들 리사이즈).
    // 그 외(빈 곳을 새로 누른 경우)에는 지금까지처럼 이 지점 자체가
    // 고정점이 되는 새 범위 드래그로 취급한다.
    const committedNights = Math.max(nights, 0);
    if (value && committedNights > 0) {
      const committedEndKey = dateToKey(
        new Date(
          toDateOnly(new Date(value)).getTime() + committedNights * 86400000,
        ),
      );
      if (dateKey === committedEndKey) {
        setDragAnchor(value);
        setDragOver(dateKey);
        return;
      }
      if (dateKey === value) {
        setDragAnchor(committedEndKey);
        setDragOver(dateKey);
        return;
      }
    }

    setDragAnchor(dateKey);
    setDragOver(dateKey);
  }

  function handleDayMouseEnter(dateKey: string) {
    if (dragAnchor === null) return;
    if (toDateOnly(new Date(dateKey)).getTime() < today.getTime()) return;
    setDragOver(dateKey);
  }

  // 마우스를 뗀 지점은 달력 칸 밖일 수도 있어 window 전체에서 mouseup을
  // 듣는다. 실제로 다른 칸까지 끌었으면(dragOver !== dragAnchor) 범위로
  // 확정하고, 움직임 없이 뗐으면 기존 클릭 로직(handleDayClick)에 맡긴다.
  useEffect(() => {
    if (dragAnchor === null) return;

    function handleMouseUp() {
      if (dragAnchor === null) return;

      if (dragOver === null || dragOver === dragAnchor) {
        handleDayClick(dragAnchor);
      } else {
        const [rangeStart, rangeEnd] = [dragAnchor, dragOver].sort();
        const diffDays = Math.round(
          (toDateOnly(new Date(rangeEnd)).getTime() -
            toDateOnly(new Date(rangeStart)).getTime()) /
            86400000,
        );
        onSelect(rangeStart);
        onSelectRange?.(rangeStart, diffDays);
        setPendingStart(null);
      }

      setDragAnchor(null);
      setDragOver(null);
    }

    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
    // dragOver/pendingStart는 최신 값을 클로저로 참조해야 해서 매번 리스너를
    // 다시 붙인다(계산 비용이 큰 작업이 아니라 렌더마다 재등록해도 괜찮다).
  }, [dragAnchor, dragOver, handleDayClick, onSelect, onSelectRange]);

  // 드래그 중에는 커밋된 value/nights 대신 dragAnchor~dragOver로 실시간
  // 미리보기를 그린다.
  const dragOrdered: [string, string] | null =
    dragAnchor !== null
      ? ([dragAnchor, dragOver ?? dragAnchor].sort() as [string, string])
      : null;

  const start = dragOrdered
    ? toDateOnly(new Date(dragOrdered[0]))
    : value
      ? toDateOnly(new Date(value))
      : null;
  const n = dragOrdered
    ? Math.round(
        (toDateOnly(new Date(dragOrdered[1])).getTime() -
          toDateOnly(new Date(dragOrdered[0])).getTime()) /
          86400000,
      )
    : Math.max(nights, 0);
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
              onMouseDown={() =>
                handleDayMouseDown(formatDateKey(cal.year, cal.month, d))
              }
              onMouseEnter={() =>
                handleDayMouseEnter(formatDateKey(cal.year, cal.month, d))
              }
              onClick={(e) => {
                // 마우스 클릭은 mouseup 전역 리스너가 이미 처리했다(드래그
                // 여부까지 판단해야 해서). 여기서는 키보드(Enter/Space)로
                // 활성화된 경우만 처리한다 — 그때는 event.detail이 0이다.
                if (e.detail !== 0) return;
                handleDayClick(formatDateKey(cal.year, cal.month, d));
              }}
              style={{ borderRadius: radius }}
              className={cn(
                "relative flex h-[46px] items-center justify-center text-sm transition-colors select-none",
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
