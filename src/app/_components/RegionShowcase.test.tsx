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
      screen.getByText("차와 강이 있는 조용한 가족 여행"),
    ).toBeInTheDocument();
  });

  it("각 지역 카드가 해당 지역 조건 입력 화면으로 연결된다", () => {
    render(<RegionShowcase />);

    expect(screen.getByText("하동").closest("a")).toHaveAttribute(
      "href",
      "/select/conditions?regions=HADONG",
    );
    expect(screen.getByText("영주").closest("a")).toHaveAttribute(
      "href",
      "/select/conditions?regions=YEONGJU",
    );
    expect(screen.getByText("예천").closest("a")).toHaveAttribute(
      "href",
      "/select/conditions?regions=YECHEON",
    );
  });

  it("각 카드에 일정 만들기 CTA 문구를 보여준다", () => {
    render(<RegionShowcase />);

    expect(screen.getAllByText("일정 만들기 →")).toHaveLength(3);
  });
});
