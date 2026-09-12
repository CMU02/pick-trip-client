import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/contentService", () => ({
  getContentById: vi.fn(),
}));

import { getContentById } from "@/services/contentService";
import type { ContentDetail } from "@/types/content";
import type { Day } from "@/types/itinerary";
import { useItineraryMapData } from "./useItineraryMapData";

const mockGetContentById = vi.mocked(getContentById);

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const detail = (over: Partial<ContentDetail>): ContentDetail => ({
  id: "c",
  name: "장소",
  region: "HADONG",
  imageUrl: null,
  address: "주소",
  imageUrls: [],
  operatingHours: null,
  closedDay: null,
  parking: null,
  stayDuration: null,
  reservationRequired: null,
  dataSource: null,
  latitude: 0,
  longitude: 0,
  ...over,
});

const day = (dayIndex: number, contentIds: string[]): Day => ({
  dayId: `day-${dayIndex}`,
  dayIndex,
  items: contentIds.map((contentId, i) => ({
    itemId: `item-${dayIndex}-${i}`,
    contentId,
    title: `장소 ${contentId}`,
    order: i,
    reason: "",
    pinned: false,
  })),
});

describe("useItineraryMapData", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("contentId를 좌표로 해석해 일차별 points로 만든다", async () => {
    mockGetContentById.mockImplementation((id: string) =>
      Promise.resolve(
        detail({
          id,
          latitude: 35.1 + Number(id.slice(-1)) / 100,
          longitude: 127.7,
        }),
      ),
    );

    const { result } = renderHook(
      () => useItineraryMapData([day(1, ["a1", "a2"])]),
      { wrapper },
    );

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.days).toHaveLength(1);
    expect(result.current.days[0].points).toHaveLength(2);
    expect(result.current.days[0].points[0]).toMatchObject({
      contentId: "a1",
      title: "장소 a1",
    });
    expect(result.current.days[0].route).toBeNull();
  });

  it("무효 좌표(0/0)인 장소는 points에서 제외한다", async () => {
    mockGetContentById.mockImplementation((id: string) =>
      Promise.resolve(
        id === "bad"
          ? detail({ id, latitude: 0, longitude: 0 })
          : detail({ id, latitude: 36.8, longitude: 128.6 }),
      ),
    );

    const { result } = renderHook(
      () => useItineraryMapData([day(1, ["ok", "bad"])]),
      { wrapper },
    );

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.days[0].points).toHaveLength(1);
    expect(result.current.days[0].points[0].contentId).toBe("ok");
  });

  it("좌표·경로 내용이 같으면 리렌더돼도 days 배열 참조가 안정적이다", async () => {
    mockGetContentById.mockImplementation((id: string) =>
      Promise.resolve(detail({ id, latitude: 35.1, longitude: 127.7 })),
    );

    const { result, rerender } = renderHook(
      ({ days }: { days: Day[] }) => useItineraryMapData(days),
      { wrapper, initialProps: { days: [day(1, ["a1"])] } },
    );

    await waitFor(() => expect(result.current.status).toBe("ready"));
    const firstDays = result.current.days;

    // useContentCoordinates/useItineraryRoutes는 매 렌더 새 Map을
    // 반환하므로, 내용이 같은 새 day 배열/객체로 리렌더해도(예:
    // SavedItineraryDetail의 지도 확대/축소 토글처럼 지도 내용과 무관한
    // 이유로 상위가 리렌더되며 배열 리터럴이 다시 만들어지는 상황)
    // 반환값 참조가 안정적이어야 한다 — 안 그러면 DayMapPanel의
    // useMemo([mapDay])가 매번 miss해 ItineraryMap이 마커·폴리라인을
    // 전부 다시 만든다.
    rerender({ days: [day(1, ["a1"])] });

    expect(result.current.days).toBe(firstDays);
  });

  it("좌표 내용이 실제로 달라지면 days 배열 참조도 새로 만든다", async () => {
    mockGetContentById.mockImplementation((id: string) =>
      Promise.resolve(
        detail({
          id,
          latitude: 35.1 + Number(id.slice(-1)) / 100,
          longitude: 127.7,
        }),
      ),
    );

    const { result, rerender } = renderHook(
      ({ days }: { days: Day[] }) => useItineraryMapData(days),
      { wrapper, initialProps: { days: [day(1, ["a1"])] } },
    );

    await waitFor(() => expect(result.current.status).toBe("ready"));
    const firstDays = result.current.days;

    rerender({ days: [day(1, ["a1", "a2"])] });
    await waitFor(() => expect(result.current.days[0].points).toHaveLength(2));

    expect(result.current.days).not.toBe(firstDays);
  });

  it("빈 days는 즉시 ready이고 조회하지 않는다", () => {
    const { result } = renderHook(() => useItineraryMapData([]), { wrapper });
    expect(result.current.status).toBe("ready");
    expect(result.current.days).toEqual([]);
    expect(mockGetContentById).not.toHaveBeenCalled();
  });
});
