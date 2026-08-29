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

  it("이동 거리는 별도 카드가 담당하므로 여행 요약에는 '총 이동 거리' 행을 두지 않는다", () => {
    render(
      <TripSummary
        {...baseProps}
        travelSummary={{ totalMinutes: 95, totalKm: 40 }}
      />,
    );

    expect(screen.queryByText("총 이동 거리")).not.toBeInTheDocument();
    expect(screen.queryByText("40km")).not.toBeInTheDocument();
  });
});
