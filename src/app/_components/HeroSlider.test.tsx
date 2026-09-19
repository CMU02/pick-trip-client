import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HeroSlider } from "./HeroSlider";

describe("HeroSlider", () => {
  it("6장 진행 바와 지역 pill을 보여주고 01/06으로 시작한다", () => {
    render(<HeroSlider />);

    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("/ 06")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /\d번 사진/ })).toHaveLength(
      6,
    );
    expect(screen.getAllByText("하동").length).toBeGreaterThan(0);
  });

  it("다음 사진 버튼을 누르면 카운터가 증가한다", () => {
    render(<HeroSlider />);

    fireEvent.click(screen.getAllByRole("button", { name: "다음 사진" })[0]);

    expect(screen.getByText("02")).toBeInTheDocument();
  });

  it("진행 바를 클릭하면 해당 장으로 바로 이동한다", () => {
    render(<HeroSlider />);

    fireEvent.click(screen.getByRole("button", { name: "3번 사진" }));

    expect(screen.getByText("03")).toBeInTheDocument();
  });

  it("일시정지 버튼을 누르면 재생 버튼으로 바뀐다", () => {
    render(<HeroSlider />);

    fireEvent.click(screen.getByRole("button", { name: "자동 전환 일시정지" }));

    expect(
      screen.getByRole("button", { name: "자동 전환 재생" }),
    ).toBeInTheDocument();
  });
});
