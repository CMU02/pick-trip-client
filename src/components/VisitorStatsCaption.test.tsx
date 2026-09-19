import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { VisitorStats } from "@/types/content";
import { VisitorStatsCaption } from "./VisitorStatsCaption";

const stats: VisitorStats = {
  totalVisitors: 608_859,
  dailyAverageVisitors: 19_640,
  period: "2026-07~2026-08",
  source: "한국관광공사 지역별 방문자수",
  baseDate: "2026-08-31",
  approximate: true,
};

describe("VisitorStatsCaption", () => {
  it("stats가 없으면 아무것도 렌더하지 않는다", () => {
    const { container } = render(<VisitorStatsCaption stats={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("stats가 있으면 방문자수와 '지역 기준 근사값' 문구를 보여준다", () => {
    render(<VisitorStatsCaption stats={stats} />);

    expect(
      screen.getByText("지역 방문자 608,859명 · 지역 기준 근사값"),
    ).toBeInTheDocument();
  });
});
