import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Day } from "@/types/itinerary";
import type { ItineraryMapDay } from "@/types/map";
import { DayTabs } from "./DayTabs";

const makeDay = (overrides: Partial<Day> = {}): Day => ({
  dayId: `day-${overrides.dayIndex ?? 1}`,
  dayIndex: overrides.dayIndex ?? 1,
  items: [
    {
      itemId: "item-1",
      contentId: "content-1",
      title: "쌍계사",
      order: 0,
      reason: "",
      pinned: false,
    },
  ],
  ...overrides,
});

const emptyMap = new Map<number, ItineraryMapDay>();

describe("DayTabs", () => {
  it("일정이 하루뿐이면 탭을 렌더하지 않는다", () => {
    const { container } = render(
      <DayTabs
        days={[makeDay({ dayIndex: 1 })]}
        mapDaysByIndex={emptyMap}
        selectedIndex={0}
        onSelect={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("일차마다 탭을 렌더하고 곳 수를 라벨에 넣는다", () => {
    render(
      <DayTabs
        days={[
          makeDay({ dayIndex: 1, totalTravelKm: 38.5 }),
          makeDay({ dayIndex: 2 }),
        ]}
        mapDaysByIndex={emptyMap}
        selectedIndex={0}
        onSelect={vi.fn()}
      />,
    );

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(2);
    expect(tabs[0]).toHaveTextContent("1일차");
    expect(tabs[0]).toHaveTextContent("1곳 · 38.5km");
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[1]).toHaveAttribute("aria-selected", "false");
  });

  it("탭을 클릭하면 그 인덱스로 onSelect를 호출한다", async () => {
    const onSelect = vi.fn();
    render(
      <DayTabs
        days={[makeDay({ dayIndex: 1 }), makeDay({ dayIndex: 2 })]}
        mapDaysByIndex={emptyMap}
        selectedIndex={0}
        onSelect={onSelect}
      />,
    );

    await userEvent.click(screen.getAllByRole("tab")[1]);

    expect(onSelect).toHaveBeenCalledWith(1);
  });
});
