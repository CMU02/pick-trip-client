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

  it("출발일 클릭 후 이후 날짜를 클릭하면 onSelectRange를 박 수와 함께 호출한다", async () => {
    const onSelect = vi.fn();
    const onSelectRange = vi.fn();
    render(
      <TravelDateCalendar
        value="2026-09-01"
        nights={0}
        onSelect={onSelect}
        onSelectRange={onSelectRange}
        subtitle=""
      />,
    );

    await userEvent.click(screen.getByText("10"));
    await userEvent.click(screen.getByText("13"));

    expect(onSelectRange).toHaveBeenCalledWith(
      expect.stringMatching(/-10$/),
      3,
    );
  });

  it("같은 날짜를 두 번 클릭하면 0박(당일치기)으로 onSelectRange를 호출한다", async () => {
    const onSelect = vi.fn();
    const onSelectRange = vi.fn();
    render(
      <TravelDateCalendar
        value="2026-09-01"
        nights={0}
        onSelect={onSelect}
        onSelectRange={onSelectRange}
        subtitle=""
      />,
    );

    await userEvent.click(screen.getByText("10"));
    await userEvent.click(screen.getByText("10"));

    expect(onSelectRange).toHaveBeenCalledWith(
      expect.stringMatching(/-10$/),
      0,
    );
  });

  it("출발일보다 이른 날짜를 다시 클릭하면 그 날짜를 새 출발일로 onSelect한다", async () => {
    const onSelect = vi.fn();
    const onSelectRange = vi.fn();
    render(
      <TravelDateCalendar
        value="2026-09-01"
        nights={0}
        onSelect={onSelect}
        onSelectRange={onSelectRange}
        subtitle=""
      />,
    );

    await userEvent.click(screen.getByText("13"));
    await userEvent.click(screen.getByText("10"));

    expect(onSelectRange).not.toHaveBeenCalled();
    expect(onSelect).toHaveBeenLastCalledWith(expect.stringMatching(/-10$/));
  });

  it("범위를 한 번 확정한 뒤 다시 클릭하면 새 출발일부터 다시 시작한다", async () => {
    const onSelect = vi.fn();
    const onSelectRange = vi.fn();
    render(
      <TravelDateCalendar
        value="2026-09-01"
        nights={0}
        onSelect={onSelect}
        onSelectRange={onSelectRange}
        subtitle=""
      />,
    );

    await userEvent.click(screen.getByText("10"));
    await userEvent.click(screen.getByText("13"));
    onSelect.mockClear();
    onSelectRange.mockClear();

    await userEvent.click(screen.getByText("15"));
    expect(onSelect).toHaveBeenCalledWith(expect.stringMatching(/-15$/));
    expect(onSelectRange).not.toHaveBeenCalled();

    await userEvent.click(screen.getByText("17"));
    expect(onSelectRange).toHaveBeenCalledWith(
      expect.stringMatching(/-15$/),
      2,
    );
  });

  it("onSelectRange가 없으면 매 클릭이 항상 onSelect만 호출한다(하위 호환)", async () => {
    const onSelect = vi.fn();
    render(
      <TravelDateCalendar
        value="2026-09-01"
        nights={0}
        onSelect={onSelect}
        subtitle=""
      />,
    );

    await userEvent.click(screen.getByText("10"));
    await userEvent.click(screen.getByText("13"));

    expect(onSelect).toHaveBeenNthCalledWith(1, expect.stringMatching(/-10$/));
    expect(onSelect).toHaveBeenNthCalledWith(2, expect.stringMatching(/-13$/));
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
