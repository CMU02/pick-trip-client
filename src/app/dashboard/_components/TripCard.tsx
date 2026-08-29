"use client";

import Link from "next/link";
import { useState } from "react";

import { ShareButton } from "@/app/itinerary/_components/ShareButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { formatDuration } from "@/lib/itinerary";
import type { SavedItinerarySummary } from "@/types/itinerary";
import { REGION_LABELS } from "@/types/region";

interface TripCardProps {
  item: SavedItinerarySummary;
  onRemove: (itineraryId: string) => void;
}

export function TripCard({ item, onRemove }: TripCardProps) {
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Icon name="calendar" size={18} className="text-primary" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">
              {item.title}
            </p>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {REGION_LABELS[item.region]} · {item.travelDate}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="더보기"
            className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Icon name="more" size={18} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* 상세는 그 자리에서 펼치지 않고 "내 여행" 페이지로 이동한다. */}
            <DropdownMenuItem asChild>
              <Link href="/itineraries">상세보기</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setShareOpen((v) => !v)}>
              공유하기
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => onRemove(item.itineraryId)}
            >
              삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {REGION_LABELS[item.region]}
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {formatDuration(item.duration)}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1 text-sm text-muted-foreground">
        <span>{item.travelDate}</span>
        <span aria-hidden="true">→</span>
      </div>

      {shareOpen && (
        <div className="mt-4 border-t border-border pt-4">
          <ShareButton itineraryId={item.itineraryId} />
        </div>
      )}
    </div>
  );
}
