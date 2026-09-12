import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HowItWorksSection } from "./HowItWorksSection";

describe("HowItWorksSection", () => {
  it("HOW? 라벨과 4단계 제목을 보여준다", () => {
    render(<HowItWorksSection />);

    expect(screen.getByText("HOW?")).toBeInTheDocument();
    // 각 단계명은 슬라이드 제목과 하단 진행 바 캡션에 함께 나온다.
    for (const label of [
      "여행 조건",
      "콘텐츠 담기",
      "AI 일정 생성",
      "AI 일정 결과",
    ]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
  });

  it("각 단계의 보조 라벨과 화면 캡쳐 alt를 보여준다", () => {
    render(<HowItWorksSection />);

    expect(screen.getByText("평균 30초")).toBeInTheDocument();
    expect(screen.getByAltText(/AI 일정 결과/)).toBeInTheDocument();
  });

  it("판단 기준 3가지(이동 거리·운영 시간·식사 시간)를 헤더 아래에 보여준다", () => {
    render(<HowItWorksSection />);

    for (const title of ["이동 거리", "운영 시간", "식사 시간"]) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });

  it("다음 단계 버튼을 누르면 슬라이드 트랙이 한 칸 이동한다", () => {
    render(<HowItWorksSection />);

    const track = screen.getByTestId("how-carousel-track");
    expect(track).toHaveStyle({ transform: "translateX(-0%)" });

    fireEvent.click(screen.getByRole("button", { name: "다음 단계" }));
    expect(track).toHaveStyle({ transform: "translateX(-100%)" });
  });

  it("이전 단계 버튼을 첫 슬라이드에서 누르면 마지막 슬라이드로 순환한다", () => {
    render(<HowItWorksSection />);

    fireEvent.click(screen.getByRole("button", { name: "이전 단계" }));
    expect(screen.getByTestId("how-carousel-track")).toHaveStyle({
      transform: "translateX(-300%)",
    });
  });

  it("진행 바를 클릭하면 해당 단계로 바로 이동한다", () => {
    render(<HowItWorksSection />);

    fireEvent.click(
      screen.getByRole("button", { name: "AI 일정 생성 단계로 이동" }),
    );
    expect(screen.getByTestId("how-carousel-track")).toHaveStyle({
      transform: "translateX(-200%)",
    });
  });

  it("자동 전환 정지 버튼을 누르면 자동 재생 버튼으로 바뀐다", () => {
    render(<HowItWorksSection />);

    fireEvent.click(screen.getByRole("button", { name: "자동 전환 정지" }));
    expect(
      screen.getByRole("button", { name: "자동 재생" }),
    ).toBeInTheDocument();
  });

  describe("키보드 포커스와 자동 전환", () => {
    // INTERVAL_MS(3000ms)보다 약간 긴 시간 — 실제 컴포넌트 내부 상수는
    // export하지 않으므로 여기서는 값을 하드코딩해 타이머를 흘려보낸다.
    const INTERVAL_MS = 3000;

    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("캐러셀 컨트롤에 키보드 포커스가 있는 동안 자동 전환을 멈춘다", () => {
      render(<HowItWorksSection />);
      const track = screen.getByTestId("how-carousel-track");
      const prevButton = screen.getByRole("button", { name: "이전 단계" });

      // 마우스 hover 없이 포커스만 들어온 상태 — 이전에는 이 경우 자동
      // 전환이 멈추지 않았다(WAI-ARIA 캐러셀 패턴 위반).
      act(() => {
        prevButton.focus();
      });
      act(() => {
        vi.advanceTimersByTime(INTERVAL_MS + 500);
      });
      expect(track).toHaveStyle({ transform: "translateX(-0%)" });

      // 포커스가 빠지면 다시 자동 전환된다.
      act(() => {
        prevButton.blur();
      });
      act(() => {
        vi.advanceTimersByTime(INTERVAL_MS + 500);
      });
      expect(track).toHaveStyle({ transform: "translateX(-100%)" });
    });
  });
});
