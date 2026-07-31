import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useSavedItinerariesStore } from "@/stores/savedItinerariesStore";
import type { SavedItinerarySummary } from "@/types/itinerary";

import { MyTripsSection } from "./MyTripsSection";

function makeItem(id: string): SavedItinerarySummary {
  return {
    itineraryId: id,
    title: `일정 ${id}`,
    region: "HADONG",
    travelDate: "2026-08-01",
    duration: 1,
    savedAt: Date.now(),
  };
}

describe("MyTripsSection", () => {
  beforeEach(() => {
    localStorage.clear();
    useSavedItinerariesStore.setState({ items: [], hydrated: true });
  });

  it("저장된 일정이 없으면 빈 상태 메시지를 보여준다", () => {
    render(<MyTripsSection />);

    expect(screen.getByText("아직 저장한 일정이 없습니다")).toBeInTheDocument();
  });

  it("저장된 일정을 카드로 렌더한다", () => {
    useSavedItinerariesStore.setState({
      items: [makeItem("1"), makeItem("2")],
      hydrated: true,
    });

    render(<MyTripsSection />);

    expect(screen.getByText("일정 1")).toBeInTheDocument();
    expect(screen.getByText("일정 2")).toBeInTheDocument();
  });

  it("6개 이하면 더보기 링크를 보여주지 않는다", () => {
    useSavedItinerariesStore.setState({
      items: Array.from({ length: 6 }, (_, i) => makeItem(String(i))),
      hydrated: true,
    });

    render(<MyTripsSection />);

    expect(
      screen.queryByRole("link", { name: /더보기/ }),
    ).not.toBeInTheDocument();
  });

  it("6개 초과면 상위 6개만 보여주고 더보기 링크를 표시한다", () => {
    useSavedItinerariesStore.setState({
      items: Array.from({ length: 8 }, (_, i) => makeItem(String(i))),
      hydrated: true,
    });

    render(<MyTripsSection />);

    expect(screen.getAllByText(/^일정 /)).toHaveLength(6);
    expect(screen.getByRole("link", { name: /더보기/ })).toHaveAttribute(
      "href",
      "/itineraries",
    );
  });
});
