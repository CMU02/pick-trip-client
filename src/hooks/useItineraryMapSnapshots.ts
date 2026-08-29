"use client";

import { useEffect } from "react";

import { useSavedItineraries } from "@/hooks/useSavedItineraries";
import { useItineraryMapSnapshotStore } from "@/stores/itineraryMapSnapshotStore";

// 저장한 일정 지도 스냅샷 스토어를 구독하는 얇은 훅. 마운트 시 hydrate 하고,
// 저장 목록에 없는 orphan 스냅샷을 정리한다.
export function useItineraryMapSnapshots() {
  const hydrate = useItineraryMapSnapshotStore((s) => s.hydrate);
  const pruneTo = useItineraryMapSnapshotStore((s) => s.pruneTo);
  const snapshots = useItineraryMapSnapshotStore((s) => s.snapshots);
  const setSnapshot = useItineraryMapSnapshotStore((s) => s.set);
  const removeSnapshot = useItineraryMapSnapshotStore((s) => s.remove);
  const { items } = useSavedItineraries();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    pruneTo(items.map((i) => i.itineraryId));
  }, [items, pruneTo]);

  return { snapshots, setSnapshot, removeSnapshot };
}
