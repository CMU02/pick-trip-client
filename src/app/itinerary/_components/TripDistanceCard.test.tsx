import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Day } from "@/types/itinerary";
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

const itineraryDay = (dayIndex: number, totalTravelKm: number | null): Day => ({
  dayId: `day-${dayIndex}`,
  dayIndex,
  items: [],
  totalTravelKm,
});

describe("TripDistanceCard", () => {
  it("CAR는 route가 있는 날들의 총 이동 거리와 하루 평균을 표시한다", () => {
    render(
      <TripDistanceCard
        mapDays={[day(1, route(12_000)), day(2, route(8_000))]}
        days={[]}
        travelMode="CAR"
      />,
    );

    expect(screen.getByText("이동 거리 합계")).toBeInTheDocument();
    expect(screen.getByText("20km")).toBeInTheDocument();
    expect(
      screen.getByText("차량 이동 기준 · 하루 평균 10km"),
    ).toBeInTheDocument();
  });

  it("CAR는 일부 날만 route가 있으면 총합은 그 날만 더하고 평균은 전체 날 수로 나눈다", () => {
    render(
      <TripDistanceCard
        mapDays={[day(1, route(30_000)), day(2, null)]}
        days={[]}
        travelMode="CAR"
      />,
    );

    expect(screen.getByText("30km")).toBeInTheDocument();
    expect(
      screen.getByText("차량 이동 기준 · 하루 평균 15km"),
    ).toBeInTheDocument();
  });

  it("CAR는 route가 하나도 없으면 아무것도 렌더하지 않는다", () => {
    const { container } = render(
      <TripDistanceCard
        mapDays={[day(1, null), day(2, null)]}
        days={[]}
        travelMode="CAR"
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("mapDays가 비어 있으면 아무것도 렌더하지 않는다", () => {
    const { container } = render(
      <TripDistanceCard mapDays={[]} days={[]} travelMode="CAR" />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("TRANSIT은 Kakao route가 아니라 백엔드 일자별 totalTravelKm 합계를 쓴다", () => {
    render(
      <TripDistanceCard
        mapDays={[day(1, route(999_000)), day(2, route(999_000))]}
        days={[itineraryDay(1, 6), itineraryDay(2, 4)]}
        travelMode="TRANSIT"
      />,
    );

    expect(screen.getByText("10km")).toBeInTheDocument();
    expect(
      screen.getByText("대중교통 이동 기준(도보 포함 근사치) · 하루 평균 5km"),
    ).toBeInTheDocument();
  });

  it("TRANSIT은 일자별 totalTravelKm이 전부 없으면 아무것도 렌더하지 않는다", () => {
    const { container } = render(
      <TripDistanceCard
        mapDays={[]}
        days={[itineraryDay(1, null), itineraryDay(2, null)]}
        travelMode="TRANSIT"
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
