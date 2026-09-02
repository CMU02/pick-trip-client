import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Day } from "@/types/itinerary";
import type { Region } from "@/types/region";
import type { CompanionCondition } from "@/types/travel-condition";
import { TripSummary } from "./TripSummary";

const baseProps = {
  regions: ["HADONG"] as Region[],
  startDate: "2026-09-05",
  nights: 1,
  companions: [] as CompanionCondition[],
  items: [],
  showItemList: false as const,
  itemCount: 3,
};

describe("TripSummary", () => {
  it("travelSummary의 총 이동 시간을 행으로 표시한다", () => {
    render(
      <TripSummary
        {...baseProps}
        travelSummary={{ totalMinutes: 95, totalKm: 40 }}
      />,
    );

    expect(screen.getByText("총 이동 시간")).toBeInTheDocument();
    expect(screen.getByText("1시간 35분")).toBeInTheDocument();
  });

  it("travelSummary의 총 이동 거리를 행으로 표시한다", () => {
    render(
      <TripSummary
        {...baseProps}
        travelSummary={{ totalMinutes: 95, totalKm: 40 }}
      />,
    );

    expect(screen.getByText("총 이동 거리")).toBeInTheDocument();
    expect(screen.getByText("40km")).toBeInTheDocument();
  });

  it("departureTime이 있으면 출발 시각 행을 표시한다", () => {
    render(
      <TripSummary {...baseProps} travelSummary={null} departureTime="09:00" />,
    );

    expect(screen.getByText("출발 시각")).toBeInTheDocument();
    expect(screen.getByText("09:00")).toBeInTheDocument();
  });

  const makeDay = (items: Day["items"]): Day => ({
    dayId: "day-1",
    dayIndex: 1,
    items,
  });

  it("days를 넘기면 일정 규모·하루 평균·총 머무는 시간 행을 더한다", () => {
    const days = [
      makeDay([
        {
          itemId: "i1",
          contentId: "c1",
          title: "쌍계사",
          order: 0,
          reason: "",
          pinned: false,
          startTime: "09:00",
          endTime: "10:30",
        },
        {
          itemId: "i2",
          contentId: "c2",
          title: "화개장터",
          order: 1,
          reason: "",
          pinned: false,
          startTime: "11:00",
          endTime: "12:00",
        },
      ]),
      { ...makeDay([]), dayId: "day-2", dayIndex: 2 },
    ];

    render(<TripSummary {...baseProps} travelSummary={null} days={days} />);

    expect(screen.getByText("일정 규모")).toBeInTheDocument();
    expect(screen.getByText("2일 · 총 2곳")).toBeInTheDocument();
    expect(screen.getByText("하루 평균")).toBeInTheDocument();
    expect(screen.getByText("약 1곳")).toBeInTheDocument();
    expect(screen.getByText("총 머무는 시간")).toBeInTheDocument();
    expect(screen.getByText("2시간 30분")).toBeInTheDocument();
  });

  it("days가 없으면 파생 요약 행을 표시하지 않는다", () => {
    render(<TripSummary {...baseProps} travelSummary={null} />);

    expect(screen.queryByText("일정 규모")).not.toBeInTheDocument();
    expect(screen.queryByText("총 머무는 시간")).not.toBeInTheDocument();
  });
});
