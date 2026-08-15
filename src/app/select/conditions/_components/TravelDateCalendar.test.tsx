import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TravelDateCalendar } from "./TravelDateCalendar";

describe("TravelDateCalendar", () => {
  it("선택된 날짜의 연/월을 헤더에 보여준다", () => {
    render(
      <TravelDateCalendar
        value="2026-09-12"
        nights={1}
        onSelect={vi.fn()}
        subtitle=""
      />,
    );

    expect(screen.getByText("2026년 9월")).toBeInTheDocument();
  });

  it("날짜 클릭 시 onSelect를 YYYY-MM-DD 형식으로 호출한다", async () => {
    const onSelect = vi.fn();
    render(
      <TravelDateCalendar
        value="2026-09-12"
        nights={1}
        onSelect={onSelect}
        subtitle=""
      />,
    );

    await userEvent.click(screen.getByText("20"));

    expect(onSelect).toHaveBeenCalledWith("2026-09-20");
  });

  it("다음 달/이전 달 버튼으로 표시 월을 이동한다", async () => {
    render(
      <TravelDateCalendar
        value="2026-09-12"
        nights={1}
        onSelect={vi.fn()}
        subtitle=""
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "다음 달" }));
    expect(screen.getByText("2026년 10월")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "이전 달" }));
    await userEvent.click(screen.getByRole("button", { name: "이전 달" }));
    expect(screen.getByText("2026년 8월")).toBeInTheDocument();
  });

  it("이전 달로 이동하면 그 달의 날짜는 전부 비활성화된다(과거)", async () => {
    render(
      <TravelDateCalendar value="" nights={0} onSelect={vi.fn()} subtitle="" />,
    );

    await userEvent.click(screen.getByRole("button", { name: "이전 달" }));

    const dayCells = screen
      .getAllByRole("button")
      .filter((btn) => /^\d+$/.test(btn.textContent ?? ""));
    expect(dayCells.length).toBeGreaterThan(0);
    for (const cell of dayCells) {
      expect(cell).toBeDisabled();
    }
  });
});
