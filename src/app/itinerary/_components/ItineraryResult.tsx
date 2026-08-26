"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { ParsedApiError } from "@/lib/errors";
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
  data: { days: Day[] };
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

  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-foreground">생성된 일정</h2>
        {headerAction}
      </div>
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
            disabled={!editor.isDirty || editor.isSaving}
            onClick={editor.onSave}
          >
            {editor.isSaving ? "저장 중..." : "변경사항 저장"}
          </Button>
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
