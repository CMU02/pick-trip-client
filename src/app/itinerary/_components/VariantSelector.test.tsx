import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ItineraryVariant } from "@/types/itinerary";
import { VariantSelector } from "./VariantSelector";

function variant(overrides: Partial<ItineraryVariant> = {}): ItineraryVariant {
  return {
    label: "자동차 힐링 루트",
    travelMode: "CAR",
    title: "하동 1박 2일 여행",
    days: [],
    adjustments: [],
    metrics: {
      totalTravelMinutes: 50,
      totalWalkingMinutes: 0,
      totalTransitCost: 3158,
      placeCount: 3,
      unavailableReasons: {},
    },
    ...overrides,
  };
}

describe("VariantSelector", () => {
  const carVariant = variant({
    label: "자동차 힐링 루트",
    travelMode: "CAR",
    metrics: {
      totalTravelMinutes: 50,
      totalWalkingMinutes: 0,
      totalTransitCost: 7100,
      placeCount: 3,
      unavailableReasons: {},
    },
  });
  const transitVariant = variant({
    label: "대중교통 힐링 루트",
    travelMode: "TRANSIT",
    metrics: {
      totalTravelMinutes: 95,
      totalWalkingMinutes: 40,
      totalTransitCost: 3000,
      placeCount: 3,
      unavailableReasons: {},
    },
  });

  it("안마다 카드를 렌더하고, 클릭하면 onSelect에 인덱스를 넘긴다", async () => {
    const onSelect = vi.fn();
    render(
      <VariantSelector
        variants={[carVariant, transitVariant]}
        onSelect={onSelect}
      />,
    );

    expect(
      screen.getByRole("button", { name: "자동차 힐링 루트" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "대중교통 힐링 루트" }),
    ).toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();

    await userEvent.click(
      screen.getByRole("button", { name: "대중교통 힐링 루트" }),
    );
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it("커서를 올린 카드는 강조하고 다른 카드는 흐리게 한다(호버만으로는 확정하지 않는다)", async () => {
    const onSelect = vi.fn();
    render(
      <VariantSelector
        variants={[carVariant, transitVariant]}
        onSelect={onSelect}
      />,
    );

    const carCard = screen.getByRole("button", { name: "자동차 힐링 루트" });
    const transitCard = screen.getByRole("button", {
      name: "대중교통 힐링 루트",
    });

    await userEvent.hover(carCard);
    expect(carCard.className).toMatch(/scale-\[1\.05\]/);
    expect(transitCard.className).toMatch(/opacity-35/);
    expect(onSelect).not.toHaveBeenCalled();

    await userEvent.unhover(carCard);
    expect(carCard.className).not.toMatch(/scale-\[1\.05\]/);
    expect(transitCard.className).not.toMatch(/opacity-35/);
  });

  it("안별 비교 지표(이동 시간·도보 시간·교통비·장소 수)를 표로 보여준다", () => {
    render(
      <VariantSelector
        variants={[carVariant, transitVariant]}
        onSelect={vi.fn()}
      />,
    );

    // CAR: 50분, 0분(도보 없음), 7,100원, 3곳
    expect(screen.getByText("50분")).toBeInTheDocument();
    expect(screen.getAllByText("0분").length).toBeGreaterThan(0);
    expect(screen.getByText("7,100원")).toBeInTheDocument();
    // TRANSIT: 1시간 35분, 40분, 3,000원
    expect(screen.getByText("1시간 35분")).toBeInTheDocument();
    expect(screen.getByText("40분")).toBeInTheDocument();
    expect(screen.getByText("3,000원")).toBeInTheDocument();
    expect(screen.getAllByText("3곳").length).toBe(2);
  });

  it("산출 불가(null)인 지표는 '산출 불가'로 표시하고 사유를 title에 담는다", () => {
    const unknownCost = variant({
      label: "대중교통 힐링 루트",
      travelMode: "TRANSIT",
      metrics: {
        totalTravelMinutes: null,
        totalWalkingMinutes: null,
        totalTransitCost: null,
        placeCount: 2,
        unavailableReasons: {
          totalTravelMinutes: "UNKNOWN_TRAVEL_DISTANCE",
          totalWalkingMinutes: "UNKNOWN_TRAVEL_DISTANCE",
          totalTransitCost: "UNKNOWN_TRAVEL_DISTANCE",
        },
      },
    });

    render(
      <VariantSelector
        variants={[carVariant, unknownCost]}
        onSelect={vi.fn()}
      />,
    );

    const unavailableCells = screen.getAllByText("산출 불가");
    expect(unavailableCells).toHaveLength(3);
    for (const cell of unavailableCells) {
      expect(cell).toHaveAttribute(
        "title",
        "구간 좌표를 몰라 이동 거리를 잴 수 없었어요",
      );
    }
  });
});
