import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StepsSection } from "./StepsSection";

describe("StepsSection", () => {
  it("세 단계 제목과 설명을 순서대로 보여준다", () => {
    render(<StepsSection />);

    expect(screen.getByText("세 단계로 끝나요")).toBeInTheDocument();

    expect(screen.getByText("지역과 날짜 선택")).toBeInTheDocument();
    expect(
      screen.getByText("가고 싶은 지역과 출발일, 기간을 고릅니다."),
    ).toBeInTheDocument();

    expect(screen.getByText("콘텐츠 담기")).toBeInTheDocument();
    expect(
      screen.getByText("마음에 드는 장소를 바구니에 담고 우선순위를 정합니다."),
    ).toBeInTheDocument();

    expect(screen.getByText("AI 일정 생성")).toBeInTheDocument();
    expect(
      screen.getByText("이동 거리와 운영 시간을 고려한 일정이 만들어집니다."),
    ).toBeInTheDocument();
  });

  it("각 단계에 순번 1/2/3을 보여준다", () => {
    render(<StepsSection />);

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
