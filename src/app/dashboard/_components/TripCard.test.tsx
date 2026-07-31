import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { getItinerary } from "@/services/itineraryService";
import type { SavedItinerarySummary } from "@/types/itinerary";

import { TripCard } from "./TripCard";

vi.mock("@/services/itineraryService", () => ({
  getItinerary: vi.fn(),
}));

vi.mock("@/services/shareService", () => ({
  createShare: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    runAuthed: (fn: (token?: string) => Promise<unknown>) =>
      fn("access-token-1"),
  }),
}));

const stub: SavedItinerarySummary = {
  itineraryId: "it-1",
  title: "2박 3일 가족 여행",
  region: "HADONG",
  travelDate: "2026-08-01",
  duration: 2,
  savedAt: Date.now(),
};

describe("TripCard", () => {
  it("제목/부제/chip을 렌더한다", () => {
    render(<TripCard item={stub} onRemove={vi.fn()} />);

    expect(screen.getByText("2박 3일 가족 여행")).toBeInTheDocument();
    expect(screen.getByText("하동 · 2026-08-01")).toBeInTheDocument();
    expect(screen.getAllByText("하동").length).toBeGreaterThan(0);
    expect(screen.getByText("2박 3일")).toBeInTheDocument();
  });

  it("케밥 메뉴에서 상세보기를 누르면 getItinerary를 호출하고 결과를 보여준다", async () => {
    vi.mocked(getItinerary).mockResolvedValue({
      itineraryId: "it-1",
      title: "2박 3일 가족 여행",
      region: "HADONG",
      travelDate: "2026-08-01",
      duration: 2,
      lastModifiedAt: "2026-07-31T00:00:00Z",
      days: [],
    });

    render(<TripCard item={stub} onRemove={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "더보기" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "상세보기" }));

    expect(getItinerary).toHaveBeenCalledWith("it-1", "access-token-1");
    expect(await screen.findByText("생성된 일정")).toBeInTheDocument();
  });

  it("케밥 메뉴에서 공유하기를 누르면 공유 버튼이 나타난다", async () => {
    render(<TripCard item={stub} onRemove={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "더보기" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "공유하기" }));

    expect(
      screen.getByRole("button", { name: "공유하기" }),
    ).toBeInTheDocument();
  });

  it("케밥 메뉴에서 삭제를 누르면 onRemove를 호출한다", async () => {
    const onRemove = vi.fn();
    render(<TripCard item={stub} onRemove={onRemove} />);

    await userEvent.click(screen.getByRole("button", { name: "더보기" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "삭제" }));

    expect(onRemove).toHaveBeenCalledWith("it-1");
  });
});
