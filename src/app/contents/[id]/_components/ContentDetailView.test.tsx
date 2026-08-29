import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockBack = vi.fn();
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
  usePathname: () => "/contents/1",
}));

const mockUseAuth = vi.fn();
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

import { useBasketStore } from "@/stores/basketStore";
import { useFavoriteStore } from "@/stores/favoriteStore";
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
    mockBack.mockClear();
    mockPush.mockClear();
    mockUseAuth.mockReturnValue({ status: "authenticated" });
    // 전역 스토어는 테스트 간 상태가 누수되므로 초기 상태로 리셋한다.
    useBasketStore.setState({ items: [], hydrated: false });
    useFavoriteStore.setState({ items: [], hydrated: false });
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

  it("운영시간 원문에 <br> 태그가 있으면 여러 줄로 나눠 렌더한다", () => {
    render(
      <ContentDetailView
        content={{
          ...stub,
          operatingHours: "평일 09:00~18:00<br>주말 10:00~17:00",
        }}
      />,
    );
    expect(screen.getByText("평일 09:00~18:00")).toBeInTheDocument();
    expect(screen.getByText("주말 10:00~17:00")).toBeInTheDocument();
    expect(
      screen.queryByText(/평일 09:00~18:00<br>주말/),
    ).not.toBeInTheDocument();
  });

  it("데이터 출처를 렌더한다", () => {
    render(<ContentDetailView content={stub} />);
    expect(screen.getByText("한국관광공사")).toBeInTheDocument();
  });

  it("백엔드가 내려주는 원본 dataSource 값과 무관하게 데이터 출처를 한국관광공사로 표시한다", () => {
    render(<ContentDetailView content={{ ...stub, dataSource: "TourAPI" }} />);
    expect(screen.getByText("한국관광공사")).toBeInTheDocument();
    expect(screen.queryByText("TourAPI")).not.toBeInTheDocument();
  });

  it("dataSource가 없으면 데이터 출처 행을 렌더하지 않는다", () => {
    render(<ContentDetailView content={{ ...stub, dataSource: null }} />);
    expect(screen.queryByText("데이터 출처")).not.toBeInTheDocument();
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

  it("찜 버튼을 렌더하고 클릭하면 찜 상태가 토글된다", async () => {
    render(<ContentDetailView content={stub} />);

    await userEvent.click(screen.getByRole("button", { name: "찜하기" }));

    expect(screen.getByRole("button", { name: "찜 해제" })).toBeInTheDocument();
  });

  it("비로그인 상태에서는 하트가 비활성이고 클릭 시 로그인으로 유도한다", async () => {
    mockUseAuth.mockReturnValue({ status: "unauthenticated" });
    useFavoriteStore.setState({ items: [stub], hydrated: true });

    render(<ContentDetailView content={stub} />);

    const heart = screen.getByRole("button", { name: "찜하기" });
    expect(heart).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(heart);

    expect(mockPush).toHaveBeenCalledWith("/login?next=%2Fcontents%2F1");
    expect(useFavoriteStore.getState().items).toHaveLength(1);
  });

  it("showBasketAction이 false이면 찜 버튼도 렌더하지 않는다", () => {
    render(<ContentDetailView content={stub} showBasketAction={false} />);
    expect(
      screen.queryByRole("button", { name: /찜하기|찜 해제/ }),
    ).not.toBeInTheDocument();
  });

  it("마운트 시 최근 본 콘텐츠로 기록한다", () => {
    render(<ContentDetailView content={stub} />);

    const items = useRecentViewsStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].content.id).toBe("1");
  });
});
