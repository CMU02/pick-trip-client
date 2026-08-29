import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ItineraryMapDay, RouteResult } from "@/types/map";
import { TripDistanceCard } from "./TripDistanceCard";

const route = (totalDistanceMeters: number): RouteResult => ({
  totalDistanceMeters,
  totalDurationSeconds: 600,
  segments: [{ distanceMeters: totalDistanceMeters, durationSeconds: 600 }],
  path: [
    [127.7, 35.1],
    [127.72, 35.12],
  ],
});

const day = (dayIndex: number, r: RouteResult | null): ItineraryMapDay => ({
  dayIndex,
  points: [
    { lat: 35.1, lng: 127.7, contentId: `c-${dayIndex}-0`, title: "가" },
    { lat: 35.12, lng: 127.72, contentId: `c-${dayIndex}-1`, title: "나" },
  ],
  route: r,
});

describe("TripDistanceCard", () => {
  it("route가 있는 날들의 총 이동 거리와 하루 평균을 표시한다", () => {
    render(
      <TripDistanceCard
        mapDays={[day(1, route(12_000)), day(2, route(8_000))]}
      />,
    );

    expect(screen.getByText("이동 거리 합계")).toBeInTheDocument();
    expect(screen.getByText("20km")).toBeInTheDocument();
    expect(
      screen.getByText("차량 이동 기준 · 하루 평균 10km"),
    ).toBeInTheDocument();
  });

  it("일부 날만 route가 있으면 총합은 그 날만 더하고 평균은 전체 날 수로 나눈다", () => {
    render(
      <TripDistanceCard mapDays={[day(1, route(30_000)), day(2, null)]} />,
    );

    expect(screen.getByText("30km")).toBeInTheDocument();
    expect(
      screen.getByText("차량 이동 기준 · 하루 평균 15km"),
    ).toBeInTheDocument();
  });

  it("route가 하나도 없으면 아무것도 렌더하지 않는다", () => {
    const { container } = render(
      <TripDistanceCard mapDays={[day(1, null), day(2, null)]} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("mapDays가 비어 있으면 아무것도 렌더하지 않는다", () => {
    const { container } = render(<TripDistanceCard mapDays={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
