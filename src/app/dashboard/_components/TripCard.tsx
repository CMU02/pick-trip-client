"use client";

import { useState } from "react";

import { ItineraryResult } from "@/app/itinerary/_components/ItineraryResult";
import { ShareButton } from "@/app/itinerary/_components/ShareButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { parseApiError } from "@/lib/errors";
import { formatDuration } from "@/lib/itinerary";
import { getItinerary } from "@/services/itineraryService";
import type {
  ItineraryResponse,
  SavedItinerarySummary,
} from "@/types/itinerary";
import { REGION_LABELS } from "@/types/region";

type Panel = "none" | "detail" | "share";

type DetailState =
  | { status: "loading" }
  | { status: "loaded"; data: ItineraryResponse }
  | { status: "error"; message: string };

interface TripCardProps {
  item: SavedItinerarySummary;
  onRemove: (itineraryId: string) => void;
}

export function TripCard({ item, onRemove }: TripCardProps) {
  const [panel, setPanel] = useState<Panel>("none");
  const [detail, setDetail] = useState<DetailState | null>(null);

  async function fetchDetail() {
    setDetail({ status: "loading" });
    try {
      const data = await getItinerary(item.itineraryId);
      setDetail({ status: "loaded", data });
    } catch (err) {
      setDetail({ status: "error", message: parseApiError(err).message });
    }
  }

  function handleToggleDetail() {
    if (panel === "detail") {
      setPanel("none");
      return;
    }
    setPanel("detail");
    if (!detail || detail.status === "error") {
      fetchDetail();
    }
  }

  function handleToggleShare() {
    setPanel((prev) => (prev === "share" ? "none" : "share"));
  }

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50">
            <Icon name="calendar" size={18} className="text-amber-500" />
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
            <DropdownMenuItem onSelect={handleToggleDetail}>
              상세보기
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleToggleShare}>
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

      {panel === "share" && (
        <div className="mt-4 border-t border-border pt-4">
          <ShareButton itineraryId={item.itineraryId} />
        </div>
      )}

      {panel === "detail" && (
        <div className="mt-4 border-t border-border pt-4">
          {detail?.status === "loading" && (
            <p className="text-sm text-muted-foreground">불러오는 중...</p>
          )}
          {detail?.status === "error" && (
            <div className="flex items-center gap-2">
              <p className="text-sm text-destructive">{detail.message}</p>
              <button
                type="button"
                className="text-sm underline"
                onClick={fetchDetail}
              >
                다시 시도
              </button>
            </div>
          )}
          {detail?.status === "loaded" && (
            <ItineraryResult data={detail.data} />
          )}
        </div>
      )}
    </div>
  );
}
