import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockBack = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: mockBack }),
}));

import { useBasketStore } from "@/stores/basketStore";
import { useRecentViewsStore } from "@/stores/recentViewsStore";
import type { ContentDetail } from "@/types/content";

import { ContentDetailView } from "./ContentDetailView";

const stub: ContentDetail = {
  id: "1",
  name: "쌍계사",
  region: "HADONG",
  category: "CULTURE",
  imageUrl: null,
  address: "경남 하동군 화개면",
  summary: "천년 고찰, 봄이면 벚꽃이 만발한다",
  indoor: false,
  operatingHours: "09:00 - 18:00",
  closedDay: "연중무휴",
  parking: true,
  stayDuration: "1시간",
  reservationRequired: false,
  dataSource: "한국관광공사",
  imageUrls: [],
};

describe("ContentDetailView", () => {
  beforeEach(() => {
    localStorage.clear();
    // 전역 스토어는 테스트 간 상태가 누수되므로 초기 상태로 리셋한다.
    useBasketStore.setState({ items: [], hydrated: false });
    useRecentViewsStore.setState({ items: [], hydrated: false });
  });

  it("콘텐츠 이름을 렌더한다", () => {
    render(<ContentDetailView content={stub} />);
    expect(screen.getByText("쌍계사")).toBeInTheDocument();
  });

  it("운영시간을 렌더한다", () => {
    render(<ContentDetailView content={stub} />);
    expect(screen.getByText("09:00 - 18:00")).toBeInTheDocument();
  });

  it("주차 가능이면 '가능'을 렌더한다", () => {
    render(<ContentDetailView content={stub} />);
    expect(screen.getByText("가능")).toBeInTheDocument();
  });

  it("예약 불필요이면 '불필요'를 렌더한다", () => {
    render(<ContentDetailView content={stub} />);
    expect(screen.getByText("불필요")).toBeInTheDocument();
  });

  it("운영시간이 null이면 정보 없음을 표시한다", () => {
    render(<ContentDetailView content={{ ...stub, operatingHours: null }} />);
    expect(screen.getAllByText("정보 없음").length).toBeGreaterThan(0);
  });

  it("데이터 출처를 렌더한다", () => {
    render(<ContentDetailView content={stub} />);
    expect(screen.getByText("한국관광공사")).toBeInTheDocument();
  });

  it("담기 버튼을 렌더한다", () => {
    render(<ContentDetailView content={stub} />);
    expect(screen.getByRole("button", { name: /담기/ })).toBeInTheDocument();
  });

  it("담기 버튼 클릭 시 새로고침 없이 담김으로 즉시 바뀐다", async () => {
    render(<ContentDetailView content={stub} />);

    await userEvent.click(screen.getByRole("button", { name: "담기" }));

    expect(screen.getByRole("button", { name: "담김" })).toBeInTheDocument();
  });

  it("showBasketAction이 false이면 담기 버튼을 렌더하지 않는다", () => {
    render(<ContentDetailView content={stub} showBasketAction={false} />);
    expect(
      screen.queryByRole("button", { name: /담기|담김/ }),
    ).not.toBeInTheDocument();
  });

  it("backHref가 없으면 '← 목록으로' 클릭 시 router.back을 호출한다", async () => {
    render(<ContentDetailView content={stub} />);

    await userEvent.click(screen.getByRole("button", { name: /목록으로/ }));

    expect(mockBack).toHaveBeenCalledOnce();
  });

  it("backHref가 주어지면 '← 목록으로'가 해당 경로로 이동하는 링크다", () => {
    render(<ContentDetailView content={stub} backHref="/explore" />);

    expect(screen.getByRole("link", { name: /목록으로/ })).toHaveAttribute(
      "href",
      "/explore",
    );
  });

  it("마운트 시 최근 본 콘텐츠로 기록한다", () => {
    render(<ContentDetailView content={stub} />);

    const items = useRecentViewsStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].content.id).toBe("1");
  });
});
