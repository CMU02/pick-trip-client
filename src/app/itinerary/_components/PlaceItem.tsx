"use client";

import { useState } from "react";

import { Icon } from "@/components/ui/icon";
import type { Item } from "@/types/itinerary";

interface PlaceItemProps {
  item: Item;
  isFirst?: boolean;
  isLast?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRemove?: () => void;
  onTogglePinned?: () => void;
  onOpenReplacePicker?: () => void;
}

export function PlaceItem({
  item,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onRemove,
  onTogglePinned,
  onOpenReplacePicker,
}: PlaceItemProps) {
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const editable = Boolean(
    onMoveUp || onMoveDown || onRemove || onTogglePinned || onOpenReplacePicker,
  );

  return (
    <div className="flex gap-3 py-3">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {item.order + 1}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-foreground">{item.title}</p>
          {item.pinned && (
            <span className="shrink-0 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              고정
            </span>
          )}
        </div>
        {item.reason && (
          <p className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-primary/5 px-3 py-2 text-xs text-primary">
            <Icon
              name="wand"
              size={13}
              className="mt-0.5 shrink-0 text-primary"
            />
            <span>{item.reason}</span>
          </p>
        )}

        {editable && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              disabled={isFirst}
              onClick={onMoveUp}
              aria-label="위로 이동"
              className="flex h-11 w-11 items-center justify-center rounded-[9px] border border-border text-xs text-muted-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
            >
              ▲
            </button>
            <button
              type="button"
              disabled={isLast}
              onClick={onMoveDown}
              aria-label="아래로 이동"
              className="flex h-11 w-11 items-center justify-center rounded-[9px] border border-border text-xs text-muted-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
            >
              ▼
            </button>
            <button
              type="button"
              onClick={onTogglePinned}
              aria-label={item.pinned ? "고정됨" : "고정"}
              className={`flex h-11 w-11 items-center justify-center rounded-[9px] border text-xs transition-colors ${
                item.pinned
                  ? "border-primary/40 bg-accent text-accent-foreground"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              📌
            </button>
            <button
              type="button"
              onClick={onOpenReplacePicker}
              className="inline-flex min-h-11 items-center justify-center rounded-[9px] border border-border px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted"
            >
              대체 장소
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirmingRemove) {
                  onRemove?.();
                  setConfirmingRemove(false);
                } else {
                  setConfirmingRemove(true);
                }
              }}
              className={`flex h-11 items-center justify-center rounded-[9px] border px-2.5 text-xs font-semibold transition-colors ${
                confirmingRemove
                  ? "border-destructive/40 bg-destructive/10 text-destructive"
                  : "border-border text-muted-foreground hover:border-destructive/40 hover:text-destructive"
              }`}
            >
              {confirmingRemove ? "정말 삭제?" : "삭제"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
