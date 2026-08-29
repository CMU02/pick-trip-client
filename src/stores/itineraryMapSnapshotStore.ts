import { create } from "zustand";

import type { ItineraryMapSnapshot } from "@/types/map";

const STORAGE_KEY = "pick-trip-itinerary-maps";
// 스냅샷은 폴리라인 좌표 때문에 건당 수십 KB가 될 수 있어 상한을 둔다.
const MAX_ENTRIES = 20;

type SnapshotMap = Record<string, ItineraryMapSnapshot>;

interface ItineraryMapSnapshotState {
  snapshots: SnapshotMap;
  hydrated: boolean;
  hydrate: () => void;
  set: (itineraryId: string, snapshot: ItineraryMapSnapshot) => void;
  remove: (itineraryId: string) => void;
  // 저장 목록에 없는 itineraryId 스냅샷을 정리한다.
  pruneTo: (keepIds: string[]) => void;
}

function byRecent(snapshots: SnapshotMap): [string, ItineraryMapSnapshot][] {
  return Object.entries(snapshots).sort((a, b) => b[1].savedAt - a[1].savedAt);
}

function persist(snapshots: SnapshotMap) {
  const entries = byRecent(snapshots);
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(Object.fromEntries(entries.slice(0, MAX_ENTRIES))),
    );
  } catch {
    // 용량 초과 등: 오래된 절반만 남겨 재시도. 그래도 실패하면 포기(조회 시 라이브 폴백).
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          Object.fromEntries(entries.slice(0, Math.floor(MAX_ENTRIES / 2))),
        ),
      );
    } catch {
      // no-op
    }
  }
}

export const useItineraryMapSnapshotStore = create<ItineraryMapSnapshotState>(
  (set, get) => ({
    snapshots: {},
    hydrated: false,

    hydrate: () => {
      if (get().hydrated) return;
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) set({ snapshots: JSON.parse(stored) as SnapshotMap });
      } catch {
        // 손상된 데이터는 무시
      }
      set({ hydrated: true });
    },

    set: (itineraryId, snapshot) => {
      const next = { ...get().snapshots, [itineraryId]: snapshot };
      persist(next);
      // persist 가 상한을 적용하므로, 스토어 상태도 저장된 것과 맞춘다.
      set({
        snapshots: Object.fromEntries(byRecent(next).slice(0, MAX_ENTRIES)),
      });
    },

    remove: (itineraryId) => {
      if (!(itineraryId in get().snapshots)) return;
      const { [itineraryId]: _removed, ...rest } = get().snapshots;
      persist(rest);
      set({ snapshots: rest });
    },

    pruneTo: (keepIds) => {
      const keep = new Set(keepIds);
      const current = get().snapshots;
      const next = Object.fromEntries(
        Object.entries(current).filter(([id]) => keep.has(id)),
      );
      if (Object.keys(next).length === Object.keys(current).length) return;
      persist(next);
      set({ snapshots: next });
    },
  }),
);
