import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

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
});
