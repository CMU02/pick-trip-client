"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { ParsedApiError } from "@/lib/errors";
import { hasEmptyDay } from "@/lib/itinerary";
import type { Content } from "@/types/content";
import type { Day } from "@/types/itinerary";
import type { Region } from "@/types/region";
import { AlternativePlacePicker } from "./AlternativePlacePicker";
import { DayCard } from "./DayCard";

interface ItineraryEditor {
  region: Region;
  travelDate: string;
  duration: number;
  days: Day[];
  isDirty: boolean;
  isSaving: boolean;
  saveError: ParsedApiError | null;
  onMoveItem: (dayId: string, itemId: string, direction: "up" | "down") => void;
  onRemoveItem: (dayId: string, itemId: string) => void;
  onTogglePinned: (dayId: string, itemId: string) => void;
  onReplaceItem: (dayId: string, itemId: string, replacement: Content) => void;
  onSave: () => void;
}

interface ItineraryResultProps {
  // adjustments는 generate(미리보기) 응답에만 있다. 저장·공유 응답 타입에는
  // 없으므로 그 화면에서는 자연히 배너가 안 뜬다.
  data: { days: Day[]; adjustments?: string[] };
  editor?: ItineraryEditor;
  // "생성된 일정" 제목 옆 맨 오른쪽에 붙는 액션(예: 공유하기 버튼). 이
  // 컴포넌트를 페이지 레이아웃(ItineraryResultLayout) 없이 단독으로 쓰는
  // 곳(저장한 일정 목록의 "보기" 펼침 영역)을 위한 슬롯이라 기본은 없다.
  headerAction?: ReactNode;
}

export function ItineraryResult({
  data,
  editor,
  headerAction,
}: ItineraryResultProps) {
  const [replaceTarget, setReplaceTarget] = useState<{
    dayId: string;
    itemId: string;
  } | null>(null);

  const days = editor ? editor.days : data.days;
  const adjustments = data.adjustments ?? [];
  const blockedByEmptyDay = editor ? hasEmptyDay(days) : false;

  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-bold tracking-[-0.03em] text-foreground">
          생성된 일정
        </h2>
        {headerAction}
      </div>
      {adjustments.length > 0 && (
        <div className="mt-4 rounded-xl border border-primary/25 bg-primary/5 p-4">
          <p className="flex items-center gap-1.5 text-[13px] font-bold text-primary">
            <Icon name="wand" size={14} className="shrink-0" />
            AI가 일정을 이렇게 조정했어요
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] text-foreground/80">
            {adjustments.map((adjustment) => (
              <li key={adjustment}>{adjustment}</li>
            ))}
          </ul>
        </div>
      )}
      {days.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          생성된 일정이 없습니다
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          {days.map((day) => (
            <DayCard
              key={day.dayId}
              day={day}
              onMoveItem={editor?.onMoveItem}
              onRemoveItem={editor?.onRemoveItem}
              onTogglePinned={editor?.onTogglePinned}
              onOpenReplacePicker={
                editor
                  ? (dayId, itemId) => setReplaceTarget({ dayId, itemId })
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {editor && (
        <div className="mt-4 space-y-2">
          {editor.saveError && (
            <p className="text-sm text-destructive">
              {editor.saveError.message}
              {editor.saveError.traceId &&
                ` (참고: ${editor.saveError.traceId})`}
            </p>
          )}
          <Button
            disabled={!editor.isDirty || editor.isSaving || blockedByEmptyDay}
            onClick={editor.onSave}
          >
            {editor.isSaving ? "저장 중..." : "변경사항 저장"}
          </Button>
          {blockedByEmptyDay && (
            <p className="text-sm text-muted-foreground">
              장소가 없는 날이 있어 저장할 수 없어요. 장소를 추가하거나 다시
              생성해보세요.
            </p>
          )}
        </div>
      )}

      {editor && replaceTarget && (
        <AlternativePlacePicker
          region={editor.region}
          travelDate={editor.travelDate}
          duration={editor.duration}
          onSelect={(content) => {
            editor.onReplaceItem(
              replaceTarget.dayId,
              replaceTarget.itemId,
              content,
            );
            setReplaceTarget(null);
          }}
          onClose={() => setReplaceTarget(null)}
        />
      )}
    </section>
  );
}
