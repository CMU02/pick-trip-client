import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HowItWorksSection } from "./HowItWorksSection";

describe("HowItWorksSection", () => {
  it("AI가 보는 기준 3행을 보여준다", () => {
    render(<HowItWorksSection />);

    for (const title of ["이동 거리", "운영 시간", "식사 시간"]) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
    expect(
      screen.getByText("가까운 곳끼리 묶어 하루 동선을 짧게 만듭니다"),
    ).toBeInTheDocument();
  });

  it("정적 일정 예시 타임라인 3곳과 '예시' 배지를 보여준다", () => {
    render(<HowItWorksSection />);

    expect(screen.getByText("예시")).toBeInTheDocument();
    for (const name of ["최참판댁", "고하버거 하동본점", "십리벚꽃길"]) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
    expect(screen.getByText("차로 12분")).toBeInTheDocument();
  });
});
