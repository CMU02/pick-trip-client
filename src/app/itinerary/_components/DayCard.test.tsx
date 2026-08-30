import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Day } from "@/types/itinerary";
import { DayCard } from "./DayCard";

const makeDay = (overrides: Partial<Day> = {}): Day => ({
  dayId: "day-1",
  dayIndex: 1,
  items: [
    {
      itemId: "item-1",
      contentId: "content-1",
      title: "쌍계사",
      order: 0,
      reason: "지역 대표 명소",
      pinned: false,
    },
  ],
  ...overrides,
});

describe("DayCard", () => {
  it("dayIndex 1을 1일차로 표시한다", () => {
    render(<DayCard day={makeDay({ dayIndex: 1 })} />);

    expect(screen.getByText("1일차")).toBeInTheDocument();
  });

  it("dayIndex 2를 2일차로 표시한다", () => {
    render(<DayCard day={makeDay({ dayIndex: 2 })} />);

    expect(screen.getByText("2일차")).toBeInTheDocument();
  });

  it("day의 모든 장소를 렌더한다", () => {
    render(
      <DayCard
        day={makeDay({
          items: [
            {
              itemId: "item-1",
              contentId: "content-1",
              title: "쌍계사",
              order: 0,
              reason: "",
              pinned: false,
            },
            {
              itemId: "item-2",
              contentId: "content-2",
              title: "화개장터",
              order: 1,
              reason: "",
              pinned: false,
            },
          ],
        })}
      />,
    );

    expect(screen.getByText("쌍계사")).toBeInTheDocument();
    expect(screen.getByText("화개장터")).toBeInTheDocument();
  });

  it("첫 항목은 위로 이동 버튼이, 마지막 항목은 아래로 이동 버튼이 비활성화된다", () => {
    render(
      <DayCard
        day={makeDay({
          items: [
            {
              itemId: "item-1",
              contentId: "content-1",
              title: "쌍계사",
              order: 0,
              reason: "",
              pinned: false,
            },
            {
              itemId: "item-2",
              contentId: "content-2",
              title: "화개장터",
              order: 1,
              reason: "",
              pinned: false,
            },
          ],
        })}
        onMoveItem={vi.fn()}
      />,
    );

    const upButtons = screen.getAllByRole("button", { name: "위로 이동" });
    const downButtons = screen.getAllByRole("button", { name: "아래로 이동" });

    expect(upButtons[0]).toBeDisabled();
    expect(downButtons[0]).toBeEnabled();
    expect(upButtons[1]).toBeEnabled();
    expect(downButtons[1]).toBeDisabled();
  });

  it("항목의 위로 이동 버튼 클릭 시 dayId/itemId를 바인딩해 onMoveItem을 호출한다", async () => {
    const onMoveItem = vi.fn();
    render(
      <DayCard
        day={makeDay({
          dayId: "day-9",
          items: [
            {
              itemId: "item-2",
              contentId: "content-2",
              title: "화개장터",
              order: 1,
              reason: "",
              pinned: false,
            },
            {
              itemId: "item-1",
              contentId: "content-1",
              title: "쌍계사",
              order: 0,
              reason: "",
              pinned: false,
            },
          ],
        })}
        onMoveItem={onMoveItem}
      />,
    );

    const downButtons = screen.getAllByRole("button", { name: "아래로 이동" });
    await userEvent.click(downButtons[0]);

    expect(onMoveItem).toHaveBeenCalledWith("day-9", "item-2", "down");
  });

  it("편집 콜백이 없으면 컨트롤 버튼을 렌더하지 않는다", () => {
    render(<DayCard day={makeDay()} />);

    expect(
      screen.queryByRole("button", { name: "위로 이동" }),
    ).not.toBeInTheDocument();
  });

  it("date가 있으면 헤더에 'M월 D일 (요일)'을 덧붙인다", () => {
    render(<DayCard day={makeDay({ date: "2026-07-01" })} />);

    expect(screen.getByText("7월 1일 (수)")).toBeInTheDocument();
  });

  it("하루 이동 요약이 있으면 헤더에 차량 이동 값을 표시한다", () => {
    render(
      <DayCard
        day={makeDay({ totalTravelMinutes: 75, totalTravelKm: 12.4 })}
      />,
    );

    expect(screen.getByText("차량 이동")).toBeInTheDocument();
    expect(screen.getByText("1시간 15분 · 12.4km")).toBeInTheDocument();
  });

  it("이동값이 없으면 차량 이동 항목을 표시하지 않는다", () => {
    render(
      <DayCard
        day={makeDay({ totalTravelMinutes: null, totalTravelKm: null })}
      />,
    );

    expect(screen.queryByText("차량 이동")).not.toBeInTheDocument();
  });

  it("첫 장소의 startTime을 헤더의 출발 값으로 쓴다", () => {
    render(
      <DayCard
        day={makeDay({
          items: [
            {
              itemId: "item-1",
              contentId: "content-1",
              title: "쌍계사",
              order: 0,
              reason: "",
              pinned: false,
              startTime: "09:00",
              endTime: "10:30",
            },
          ],
        })}
      />,
    );

    const label = screen.getByText("출발");
    expect(label.nextElementSibling).toHaveTextContent("09:00");
  });

  it("Kakao 길찾기 결과가 있으면 백엔드 값 대신 그 거리·시간을 쓴다", () => {
    render(
      <DayCard
        day={makeDay({ totalTravelMinutes: 75, totalTravelKm: 12.4 })}
        mapDay={{
          dayIndex: 1,
          points: [
            { lat: 35.1, lng: 127.7, contentId: "a", title: "A" },
            { lat: 35.2, lng: 127.8, contentId: "b", title: "B" },
          ],
          route: {
            totalDistanceMeters: 8300,
            totalDurationSeconds: 1200,
            segments: [{ distanceMeters: 8300, durationSeconds: 1200 }],
            path: [],
          },
        }}
      />,
    );

    expect(screen.getByText("20분 · 8.3km")).toBeInTheDocument();
    expect(screen.queryByText(/12\.4km/)).not.toBeInTheDocument();
  });

  it("route.segments가 있으면 장소 사이마다 이동 구간 pill을 렌더한다", () => {
    render(
      <DayCard
        day={makeDay({
          items: [
            {
              itemId: "i1",
              contentId: "c1",
              title: "A",
              order: 0,
              reason: "",
              pinned: false,
            },
            {
              itemId: "i2",
              contentId: "c2",
              title: "B",
              order: 1,
              reason: "",
              pinned: false,
            },
            {
              itemId: "i3",
              contentId: "c3",
              title: "C",
              order: 2,
              reason: "",
              pinned: false,
            },
          ],
        })}
        mapDay={{
          dayIndex: 1,
          points: [
            { lat: 35.1, lng: 127.7, contentId: "c1", title: "A" },
            { lat: 35.2, lng: 127.8, contentId: "c2", title: "B" },
            { lat: 35.3, lng: 127.9, contentId: "c3", title: "C" },
          ],
          route: {
            totalDistanceMeters: 12000,
            totalDurationSeconds: 1800,
            segments: [
              { distanceMeters: 4800, durationSeconds: 540 },
              { distanceMeters: 7200, durationSeconds: 1260 },
            ],
            path: [],
          },
        }}
      />,
    );

    expect(screen.getAllByText(/차로/)).toHaveLength(2);
  });

  it("route가 없으면 이동 구간 pill을 렌더하지 않는다", () => {
    render(
      <DayCard
        day={makeDay({
          items: [
            {
              itemId: "i1",
              contentId: "c1",
              title: "A",
              order: 0,
              reason: "",
              pinned: false,
            },
            {
              itemId: "i2",
              contentId: "c2",
              title: "B",
              order: 1,
              reason: "",
              pinned: false,
            },
          ],
        })}
      />,
    );

    expect(screen.queryByText(/차로/)).not.toBeInTheDocument();
  });

  it("dayNotes가 있으면 경고 스트립을 렌더한다", () => {
    render(
      <DayCard
        day={makeDay({ dayNotes: ["하루 일정이 21:00을 넘깁니다."] })}
      />,
    );

    expect(
      screen.getByText("하루 일정이 21:00을 넘깁니다."),
    ).toBeInTheDocument();
  });

  it("장소가 0개면 빈 날 문구를 보여준다", () => {
    render(<DayCard day={makeDay({ items: [] })} />);

    expect(
      screen.getByText("이 날에는 아직 일정이 없어요"),
    ).toBeInTheDocument();
  });
});
