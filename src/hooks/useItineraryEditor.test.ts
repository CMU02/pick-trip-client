import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/errors";
import * as itineraryServiceModule from "@/services/itineraryService";
import type { Content } from "@/types/content";
import type { Day, ItineraryResponse } from "@/types/itinerary";

import { useItineraryEditor } from "./useItineraryEditor";

vi.mock("@/services/itineraryService");

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    runAuthed: (fn: (token?: string) => Promise<unknown>) =>
      fn("access-token-1"),
  }),
}));

const replacementContent: Content = {
  id: "content-3",
  name: "화개장터",
  region: "HADONG",
  imageUrl: null,
  address: "경남 하동군 화개면",
};

function makeDays(): Day[] {
  return [
    {
      dayId: "day-1",
      dayIndex: 0,
      items: [
        {
          itemId: "item-1",
          contentId: "content-1",
          title: "쌍계사",
          order: 0,
          reason: "지역 대표 명소",
          pinned: false,
        },
        {
          itemId: "item-2",
          contentId: "content-2",
          title: "칠불사",
          order: 1,
          reason: "인근 명소",
          pinned: false,
        },
      ],
    },
  ];
}

// 서버 스케줄 데이터가 채워진 2일 일정.
function makeScheduledDays(): Day[] {
  return [
    {
      dayId: "day-1",
      dayIndex: 1,
      totalTravelMinutes: 30,
      totalTravelKm: 5.5,
      items: [
        {
          itemId: "item-1",
          contentId: "content-1",
          title: "쌍계사",
          order: 0,
          reason: "지역 대표 명소",
          pinned: false,
          startTime: "09:00",
          endTime: "10:30",
        },
        {
          itemId: "item-2",
          contentId: "content-2",
          title: "칠불사",
          order: 1,
          reason: "인근 명소",
          pinned: false,
          startTime: "11:00",
          endTime: "12:00",
        },
      ],
    },
    {
      dayId: "day-2",
      dayIndex: 2,
      totalTravelMinutes: 20,
      totalTravelKm: 3.1,
      items: [
        {
          itemId: "item-3",
          contentId: "content-3",
          title: "최참판댁",
          order: 0,
          reason: "문학 관련",
          pinned: false,
          startTime: "10:00",
          endTime: "11:30",
        },
      ],
    },
  ];
}

function setupWith(initialDays: Day[]) {
  return renderHook(() =>
    useItineraryEditor({
      itineraryId: "itinerary-1",
      title: "하동 1박 2일 여행",
      region: "HADONG",
      travelDate: "2026-08-01",
      duration: 1,
      initialDays,
    }),
  );
}

function setup() {
  return renderHook(() =>
    useItineraryEditor({
      itineraryId: "itinerary-1",
      title: "하동 1박 2일 여행",
      region: "HADONG",
      travelDate: "2026-08-01",
      duration: 1,
      initialDays: makeDays(),
    }),
  );
}

describe("useItineraryEditor", () => {
  const mockModifyItinerary = vi.mocked(itineraryServiceModule.modifyItinerary);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("초기 상태는 isDirty가 false이고 initialDays를 그대로 가진다", () => {
    const { result } = setup();
    expect(result.current.isDirty).toBe(false);
    expect(result.current.days).toEqual(makeDays());
  });

  it("moveItem('down')으로 항목 순서를 아래로 바꾸고 order를 재계산한다", () => {
    const { result } = setup();
    act(() => {
      result.current.moveItem("day-1", "item-1", "down");
    });
    expect(result.current.days[0].items.map((i) => i.itemId)).toEqual([
      "item-2",
      "item-1",
    ]);
    expect(result.current.days[0].items.map((i) => i.order)).toEqual([0, 1]);
    expect(result.current.isDirty).toBe(true);
  });

  it("첫 항목을 위로 이동하려 하면 아무 변화가 없다 (경계)", () => {
    const { result } = setup();
    act(() => {
      result.current.moveItem("day-1", "item-1", "up");
    });
    expect(result.current.days[0].items.map((i) => i.itemId)).toEqual([
      "item-1",
      "item-2",
    ]);
  });

  it("마지막 항목을 아래로 이동하려 하면 아무 변화가 없다 (경계)", () => {
    const { result } = setup();
    act(() => {
      result.current.moveItem("day-1", "item-2", "down");
    });
    expect(result.current.days[0].items.map((i) => i.itemId)).toEqual([
      "item-1",
      "item-2",
    ]);
  });

  it("removeItem으로 항목을 삭제하고 나머지 order를 재계산한다", () => {
    const { result } = setup();
    act(() => {
      result.current.removeItem("day-1", "item-1");
    });
    expect(result.current.days[0].items).toHaveLength(1);
    expect(result.current.days[0].items[0]).toMatchObject({
      itemId: "item-2",
      order: 0,
    });
    expect(result.current.isDirty).toBe(true);
  });

  it("togglePinned으로 고정 상태를 토글한다", () => {
    const { result } = setup();
    act(() => {
      result.current.togglePinned("day-1", "item-1");
    });
    expect(result.current.days[0].items[0].pinned).toBe(true);

    act(() => {
      result.current.togglePinned("day-1", "item-1");
    });
    expect(result.current.days[0].items[0].pinned).toBe(false);
  });

  it("replaceItem으로 contentId/title을 교체하고 reason을 비운다", () => {
    const { result } = setup();
    act(() => {
      result.current.replaceItem("day-1", "item-1", replacementContent);
    });
    expect(result.current.days[0].items[0]).toMatchObject({
      contentId: "content-3",
      title: "화개장터",
      reason: "",
    });
    expect(result.current.isDirty).toBe(true);
  });

  it("save 성공 시 올바른 SaveItineraryRequest로 modifyItinerary를 호출하고 dirty를 해제한다", async () => {
    const savedResponse: ItineraryResponse = {
      itineraryId: "itinerary-1",
      title: "하동 1박 2일 여행",
      region: "HADONG",
      travelDate: "2026-08-01",
      duration: 1,
      lastModifiedAt: "2026-08-02T00:00:00Z",
      days: makeDays(),
    };
    mockModifyItinerary.mockResolvedValue(savedResponse);

    const { result } = setup();
    act(() => {
      result.current.togglePinned("day-1", "item-1");
    });

    await act(async () => {
      await result.current.save();
    });

    expect(mockModifyItinerary).toHaveBeenCalledWith(
      "itinerary-1",
      expect.objectContaining({
        title: "하동 1박 2일 여행",
        region: "HADONG",
        travelDate: "2026-08-01",
        duration: 1,
        days: [
          expect.objectContaining({
            dayIndex: 0,
            items: [
              expect.objectContaining({ contentId: "content-1", pinned: true }),
              expect.objectContaining({ contentId: "content-2" }),
            ],
          }),
        ],
      }),
      "access-token-1",
    );

    await waitFor(() => {
      expect(result.current.isDirty).toBe(false);
    });
    expect(result.current.saveError).toBeNull();
  });

  it("moveItem으로 순서를 바꾼 뒤 save하면 바뀐 순서 그대로 modifyItinerary에 전달한다", async () => {
    const savedResponse: ItineraryResponse = {
      itineraryId: "itinerary-1",
      title: "하동 1박 2일 여행",
      region: "HADONG",
      travelDate: "2026-08-01",
      duration: 1,
      lastModifiedAt: "2026-08-02T00:00:00Z",
      days: makeDays(),
    };
    mockModifyItinerary.mockResolvedValue(savedResponse);

    const { result } = setup();
    act(() => {
      result.current.moveItem("day-1", "item-1", "down");
    });
    expect(result.current.days[0].items.map((i) => i.itemId)).toEqual([
      "item-2",
      "item-1",
    ]);

    await act(async () => {
      await result.current.save();
    });

    expect(mockModifyItinerary).toHaveBeenCalledWith(
      "itinerary-1",
      expect.objectContaining({
        days: [
          expect.objectContaining({
            items: [
              expect.objectContaining({ contentId: "content-2", order: 0 }),
              expect.objectContaining({ contentId: "content-1", order: 1 }),
            ],
          }),
        ],
      }),
      "access-token-1",
    );
  });

  it("항목의 pinned가 null/undefined여도 저장 요청에는 boolean으로 채워 보낸다", async () => {
    const savedResponse: ItineraryResponse = {
      itineraryId: "itinerary-1",
      title: "하동 1박 2일 여행",
      region: "HADONG",
      travelDate: "2026-08-01",
      duration: 1,
      lastModifiedAt: "2026-08-02T00:00:00Z",
      days: makeDays(),
    };
    mockModifyItinerary.mockResolvedValue(savedResponse);

    const days = makeDays();
    // 백엔드가 실제로는 pinned를 null로 내려보내는 경우가 있어 이를 재현한다.
    days[0].items[0].pinned = null as unknown as boolean;
    const { result } = renderHook(() =>
      useItineraryEditor({
        itineraryId: "itinerary-1",
        title: "하동 1박 2일 여행",
        region: "HADONG",
        travelDate: "2026-08-01",
        duration: 1,
        initialDays: days,
      }),
    );

    await act(async () => {
      await result.current.save();
    });

    expect(mockModifyItinerary).toHaveBeenCalledWith(
      "itinerary-1",
      expect.objectContaining({
        days: [
          expect.objectContaining({
            items: [
              expect.objectContaining({
                contentId: "content-1",
                pinned: false,
              }),
              expect.objectContaining({ contentId: "content-2" }),
            ],
          }),
        ],
      }),
      "access-token-1",
    );
  });

  it("편집한 날의 방문 시각·이동 요약은 지우고, 손대지 않은 날은 그대로 둔다", () => {
    const { result } = setupWith(makeScheduledDays());

    act(() => {
      result.current.moveItem("day-1", "item-1", "down");
    });

    const [day1, day2] = result.current.days;
    expect(day1.totalTravelMinutes).toBeNull();
    expect(day1.totalTravelKm).toBeNull();
    expect(
      day1.items.every((i) => i.startTime === null && i.endTime === null),
    ).toBe(true);
    // day-2는 건드리지 않았으므로 시각·이동값 유지
    expect(day2.totalTravelMinutes).toBe(20);
    expect(day2.items[0].startTime).toBe("10:00");
  });

  it("replaceItem도 그 날의 방문 시각·이동 요약을 지운다", () => {
    const { result } = setupWith(makeScheduledDays());

    act(() => {
      result.current.replaceItem("day-1", "item-1", replacementContent);
    });

    expect(result.current.days[0].items[0]).toMatchObject({
      contentId: "content-3",
      reason: "",
      startTime: null,
      endTime: null,
    });
    expect(result.current.days[0].totalTravelMinutes).toBeNull();
  });

  it("장소가 없는 날이 있으면 save가 요청을 보내지 않고 안내 메시지를 남긴다", async () => {
    const days = makeScheduledDays();
    days[1].items = [];
    const { result } = setupWith(days);

    await act(async () => {
      await result.current.save();
    });

    expect(mockModifyItinerary).not.toHaveBeenCalled();
    expect(result.current.saveError?.message).toMatch(/장소가 없는 날/);
  });

  it("save 실패 시 에러를 노출하고 로컬 편집 내용을 유지한다", async () => {
    mockModifyItinerary.mockRejectedValue(
      new ApiError(500, "저장에 실패했습니다.", "INTERNAL_ERROR"),
    );

    const { result } = setup();
    act(() => {
      result.current.removeItem("day-1", "item-2");
    });

    await act(async () => {
      await result.current.save();
    });

    expect(result.current.saveError?.message).toBe("저장에 실패했습니다.");
    expect(result.current.days[0].items).toHaveLength(1);
    expect(result.current.isDirty).toBe(true);
  });
});
