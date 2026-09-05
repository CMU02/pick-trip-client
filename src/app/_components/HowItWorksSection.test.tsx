import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HowItWorksSection } from "./HowItWorksSection";

describe("HowItWorksSection", () => {
  it("HOW? 라벨과 4단계 제목을 보여준다", () => {
    render(<HowItWorksSection />);

    expect(screen.getByText("HOW?")).toBeInTheDocument();
    for (const label of [
      "여행 조건",
      "콘텐츠 담기",
      "AI 일정 생성",
      "AI 일정 결과",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("각 단계의 보조 라벨과 화면 캡쳐 alt를 보여준다", () => {
    render(<HowItWorksSection />);

    expect(screen.getByText("평균 30초")).toBeInTheDocument();
    expect(screen.getByAltText("AI 일정 결과 화면")).toBeInTheDocument();
  });

  it("판단 기준 3가지(이동 거리·운영 시간·식사 시간)를 헤더 아래에 보여준다", () => {
    render(<HowItWorksSection />);

    for (const title of ["이동 거리", "운영 시간", "식사 시간"]) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });
});
