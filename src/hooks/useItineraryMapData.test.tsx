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

  it("빈 days는 즉시 ready이고 조회하지 않는다", () => {
    const { result } = renderHook(() => useItineraryMapData([]), { wrapper });
    expect(result.current.status).toBe("ready");
    expect(result.current.days).toEqual([]);
    expect(mockGetContentById).not.toHaveBeenCalled();
  });
});
