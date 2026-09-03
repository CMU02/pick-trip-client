import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RegionShowcase } from "./RegionShowcase";

describe("RegionShowcase", () => {
  it("하동/영주/예천 3개 지역과 설명을 보여준다", () => {
    render(<RegionShowcase />);

    expect(screen.getByText("하동")).toBeInTheDocument();
    expect(screen.getByText("영주")).toBeInTheDocument();
    expect(screen.getByText("예천")).toBeInTheDocument();
    expect(
      screen.getByText(
        "천년 야생차의 향기와 맑은 강물이 어우러진 휴식과 힐링의 공간",
      ),
    ).toBeInTheDocument();
  });

  it("각 지역 카드가 그 지역만 필터링된 콘텐츠 탐색으로 연결된다", () => {
    render(<RegionShowcase />);

    const hrefByLabel: Record<string, string> = {
      하동: "/explore?region=HADONG",
      영주: "/explore?region=YEONGJU",
      예천: "/explore?region=YECHEON",
    };
    for (const [label, href] of Object.entries(hrefByLabel)) {
      expect(screen.getByText(label).closest("a")).toHaveAttribute(
        "href",
        href,
      );
    }
  });

  it("각 카드에 둘러보기 CTA 문구를 보여준다", () => {
    render(<RegionShowcase />);

    expect(screen.getAllByText("둘러보기 →")).toHaveLength(3);
  });

  it("각 지역 카드에 대표 사진을 보여준다", () => {
    render(<RegionShowcase />);

    for (const label of ["하동", "영주", "예천"]) {
      expect(
        screen.getByRole("img", { name: `${label} 대표 사진` }),
      ).toBeInTheDocument();
    }
  });
});
