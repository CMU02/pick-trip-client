import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ItineraryMapSnapshot } from "@/types/map";
import { useItineraryMapSnapshotStore } from "./itineraryMapSnapshotStore";

const STORAGE_KEY = "pick-trip-itinerary-maps";

const snap = (savedAt: number): ItineraryMapSnapshot => ({
  v: 1,
  savedAt,
  days: [{ dayIndex: 1, points: [], route: null }],
});

function reset() {
  localStorage.clear();
  useItineraryMapSnapshotStore.setState({ snapshots: {}, hydrated: false });
}

describe("itineraryMapSnapshotStore", () => {
  beforeEach(reset);

  it("set 은 itineraryId 로 저장하고 localStorage 에 반영한다", () => {
    useItineraryMapSnapshotStore.getState().set("it-1", snap(1));

    expect(useItineraryMapSnapshotStore.getState().snapshots["it-1"]).toEqual(
      snap(1),
    );
    expect(
      JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"),
    ).toHaveProperty("it-1");
  });

  it("remove 는 해당 스냅샷만 지운다", () => {
    const s = useItineraryMapSnapshotStore.getState();
    s.set("it-1", snap(1));
    s.set("it-2", snap(2));
    s.remove("it-1");

    const { snapshots } = useItineraryMapSnapshotStore.getState();
    expect(snapshots).not.toHaveProperty("it-1");
    expect(snapshots).toHaveProperty("it-2");
  });

  it("pruneTo 는 목록에 없는 스냅샷을 정리한다", () => {
    const s = useItineraryMapSnapshotStore.getState();
    s.set("it-1", snap(1));
    s.set("it-2", snap(2));
    s.set("it-3", snap(3));
    s.pruneTo(["it-2"]);

    expect(
      Object.keys(useItineraryMapSnapshotStore.getState().snapshots),
    ).toEqual(["it-2"]);
  });

  it("hydrate 는 localStorage 에서 1회 로드한다", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ "it-9": snap(9) }));
    useItineraryMapSnapshotStore.getState().hydrate();

    expect(
      useItineraryMapSnapshotStore.getState().snapshots["it-9"],
    ).toBeDefined();
  });

  it("20개를 넘으면 오래된 것부터 버린다", () => {
    const s = useItineraryMapSnapshotStore.getState();
    for (let i = 1; i <= 25; i++) s.set(`it-${i}`, snap(i));

    const { snapshots } = useItineraryMapSnapshotStore.getState();
    expect(Object.keys(snapshots)).toHaveLength(20);
    // savedAt 이 큰(최신) 것들이 남는다.
    expect(snapshots["it-25"]).toBeDefined();
    expect(snapshots["it-1"]).toBeUndefined();
  });

  it("localStorage 쓰기가 실패해도 스토어 상태는 갱신된다", () => {
    const spy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new DOMException("quota", "QuotaExceededError");
      });

    useItineraryMapSnapshotStore.getState().set("it-1", snap(1));
    expect(
      useItineraryMapSnapshotStore.getState().snapshots["it-1"],
    ).toBeDefined();

    spy.mockRestore();
  });
});
