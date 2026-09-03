import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { RoutePoint, RouteResult } from "@/types/map";
import { DayRouteLegs } from "./DayRouteLegs";

const points: RoutePoint[] = [
  { lat: 35.1, lng: 127.7, contentId: "a", title: "최참판댁" },
  { lat: 35.2, lng: 127.8, contentId: "b", title: "고하버거" },
  { lat: 35.3, lng: 127.9, contentId: "c", title: "쌍계사" },
];

const route: RouteResult = {
  totalDistanceMeters: 12_000,
  totalDurationSeconds: 1800,
  segments: [
    { distanceMeters: 4800, durationSeconds: 540 },
    { distanceMeters: 7200, durationSeconds: 1260 },
  ],
  path: [],
};

describe("DayRouteLegs", () => {
  it("세그먼트마다 한 줄씩 렌더한다", () => {
    render(<DayRouteLegs points={points} route={route} />);

    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("1→2");
    expect(rows[0]).toHaveTextContent("최참판댁 → 고하버거");
    expect(rows[0]).toHaveTextContent("9분 · 4.8km");
  });

  it("순번 텍스트(1→2)를 코랄로 표시한다", () => {
    render(<DayRouteLegs points={points} route={route} />);

    expect(screen.getByText("1→2")).toHaveClass("text-primary");
  });

  it("route가 없으면 아무것도 렌더하지 않는다", () => {
    const { container } = render(<DayRouteLegs points={points} route={null} />);

    expect(container).toBeEmptyDOMElement();
  });
});
