"use client";

import { useState } from "react";

import { ItineraryResult } from "@/app/itinerary/_components/ItineraryResult";
import { ShareButton } from "@/app/itinerary/_components/ShareButton";
import { Icon } from "@/components/ui/icon";
import { useAuth } from "@/hooks/useAuth";
import { useItineraryMapSnapshots } from "@/hooks/useItineraryMapSnapshots";
import { useSavedItineraries } from "@/hooks/useSavedItineraries";
import { parseApiError } from "@/lib/errors";
import { formatDuration } from "@/lib/itinerary";
import { fromSnapshot } from "@/lib/itineraryMapSnapshot";
import { getItinerary } from "@/services/itineraryService";
import type { ItineraryResponse } from "@/types/itinerary";
import { REGION_LABELS } from "@/types/region";

type DetailState =
  | { status: "loading" }
  | { status: "loaded"; data: ItineraryResponse }
  | { status: "error"; message: string };

// "N일 전 저장" 형태의 상대 시간. 핸드오프 스펙(8번 "저장한 일정")의
// 행 메타 정보 중 하나다.
function formatSavedAgo(savedAt: number) {
  const days = Math.floor((Date.now() - savedAt) / 86400000);
  if (days <= 0) return "오늘";
  return `${days}일 전`;
}

export function SavedItinerariesList() {
  const { items, remove } = useSavedItineraries();
  const { snapshots, removeSnapshot } = useItineraryMapSnapshots();
  const { runAuthed } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, DetailState>>({});

  async function fetchDetail(itineraryId: string) {
    setDetails((prev) => ({ ...prev, [itineraryId]: { status: "loading" } }));
    try {
      const data = await runAuthed((token) => getItinerary(itineraryId, token));
      setDetails((prev) => ({
        ...prev,
        [itineraryId]: { status: "loaded", data },
      }));
    } catch (err) {
      setDetails((prev) => ({
        ...prev,
        [itineraryId]: { status: "error", message: parseApiError(err).message },
      }));
    }
  }

  function handleToggle(itineraryId: string) {
    if (expandedId === itineraryId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(itineraryId);
    if (!details[itineraryId] || details[itineraryId].status === "error") {
      fetchDetail(itineraryId);
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
        <Icon name="bookmark" size={32} className="text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          아직 저장한 일정이 없습니다
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => {
        const isExpanded = expandedId === item.itineraryId;
        const detail = details[item.itineraryId];

        return (
          <li
            key={item.itineraryId}
            className="overflow-hidden rounded-[20px] border border-border bg-card"
          >
            <div className="flex items-center gap-4.5 p-5.5">
              <div className="flex h-[58px] w-[58px] shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-[oklch(0.68_0.19_32)] to-[oklch(0.56_0.2_20)] text-center text-[11px] leading-tight font-extrabold text-white">
                <span>{REGION_LABELS[item.region]}</span>
                <span>{formatDuration(item.duration)}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[19px] font-bold tracking-tight text-foreground">
                  {item.title}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-3.5 text-[12.5px] text-muted-foreground">
                  <span>{item.travelDate}</span>
                  <span>{formatDuration(item.duration)}</span>
                  <span>{formatSavedAgo(item.savedAt)} 저장</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    remove(item.itineraryId);
                    removeSnapshot(item.itineraryId);
                  }}
                  className="text-xs text-muted-foreground transition-colors hover:text-destructive"
                >
                  목록에서 지우기
                </button>
                <button
                  type="button"
                  onClick={() => handleToggle(item.itineraryId)}
                  className="rounded-[11px] bg-primary px-4.5 py-2.5 text-[13px] font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  {isExpanded ? "접기" : "보기"}
                </button>
              </div>
            </div>

            {isExpanded && (
              <div className="border-t border-border p-5.5 pt-4">
                {detail?.status === "loading" && (
                  <p className="text-sm text-muted-foreground">
                    불러오는 중...
                  </p>
                )}
                {detail?.status === "error" && (
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-destructive">{detail.message}</p>
                    <button
                      type="button"
                      onClick={() => fetchDetail(item.itineraryId)}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                    >
                      다시 시도
                    </button>
                  </div>
                )}
                {detail?.status === "loaded" && (
                  <ItineraryResult
                    data={detail.data}
                    mapData={
                      fromSnapshot(snapshots[detail.data.itineraryId]) ??
                      undefined
                    }
                    headerAction={
                      <ShareButton itineraryId={detail.data.itineraryId} />
                    }
                  />
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
