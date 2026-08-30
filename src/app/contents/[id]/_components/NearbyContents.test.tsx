import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/contentService", () => ({
  getNearbyContents: vi.fn(),
}));

import { getNearbyContents } from "@/services/contentService";
import type { NearbyContent } from "@/types/content";

import { NearbyContents } from "./NearbyContents";

const mockGetNearbyContents = vi.mocked(getNearbyContents);

const makeNearby = (overrides: Partial<NearbyContent> = {}): NearbyContent => ({
  id: "2",
  name: "화개장터",
  region: "HADONG",
  category: "ATTRACTION",
  imageUrl: null,
  address: "경남 하동군 화개면",
  summary: undefined,
  latitude: 35.13,
  longitude: 127.62,
  distanceKm: 1.4,
  durationMinutes: 4,
  distanceBasis: "ROAD",
  ...overrides,
});

function renderNearby(props?: { fromParam?: string }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <NearbyContents contentId="1" fromParam={props?.fromParam} />
    </QueryClientProvider>,
  );
}

describe("NearbyContents", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("ROAD 항목은 자동차 소요 시간을 표시한다", async () => {
    mockGetNearbyContents.mockResolvedValueOnce({
      originContentId: "1",
      radiusKm: 5,
      source: "LOCAL",
      contents: [
        makeNearby({ id: "2", name: "화개장터", durationMinutes: 7 }),
        makeNearby({ id: "3", name: "쌍계사", durationMinutes: 2 }),
      ],
    });

    renderNearby();

    expect(await screen.findByText("화개장터")).toBeInTheDocument();
    expect(screen.getByText(/차로 약 7분/)).toBeInTheDocument();
    expect(screen.getByText(/차로 약 2분/)).toBeInTheDocument();
  });

  it("STRAIGHT 항목은 직선거리로 표기하고 소요 시간을 숨긴다", async () => {
    mockGetNearbyContents.mockResolvedValueOnce({
      originContentId: "1",
      radiusKm: 5,
      source: "TOURAPI",
      contents: [
        makeNearby({
          id: "2",
          name: "먼 전망대",
          distanceKm: 0.35,
          durationMinutes: undefined,
          distanceBasis: "STRAIGHT",
        }),
      ],
    });

    renderNearby();

    // 1km 미만은 m 단위로 표기한다.
    expect(await screen.findByText(/직선거리 약 350m/)).toBeInTheDocument();
    expect(screen.queryByText(/차로/)).not.toBeInTheDocument();
  });

  it("size=3으로 조회한다", async () => {
    mockGetNearbyContents.mockResolvedValueOnce({
      originContentId: "1",
      radiusKm: 5,
      source: "LOCAL",
      contents: [makeNearby()],
    });

    renderNearby();

    await waitFor(() =>
      expect(mockGetNearbyContents).toHaveBeenCalledWith("1", { size: 3 }),
    );
  });

  it("fromParam이 있으면 카드 링크에 ?from= 을 이어 붙인다", async () => {
    mockGetNearbyContents.mockResolvedValueOnce({
      originContentId: "1",
      radiusKm: 5,
      source: "LOCAL",
      contents: [makeNearby({ id: "2", name: "화개장터" })],
    });

    renderNearby({ fromParam: "explore" });

    const link = await screen.findByRole("link", { name: /화개장터/ });
    expect(link).toHaveAttribute("href", "/contents/2?from=explore");
  });

  it("근처에 결과가 없으면 아무것도 렌더하지 않는다", async () => {
    mockGetNearbyContents.mockResolvedValueOnce({
      originContentId: "1",
      radiusKm: 5,
      source: "LOCAL",
      contents: [],
    });

    const { container } = renderNearby();

    await waitFor(() => expect(mockGetNearbyContents).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText("근처 콘텐츠")).not.toBeInTheDocument();
  });

  it("조회가 실패하면 섹션을 숨긴다", async () => {
    mockGetNearbyContents.mockRejectedValueOnce(
      new Error("CONTENT_LOCATION_UNKNOWN"),
    );

    const { container } = renderNearby();

    await waitFor(() => expect(mockGetNearbyContents).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
