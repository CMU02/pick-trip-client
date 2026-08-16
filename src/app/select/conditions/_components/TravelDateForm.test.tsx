import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

import { useBasketStore } from "@/stores/basketStore";
import type { Content } from "@/types/content";

import { TravelDateForm } from "./TravelDateForm";

const stub: Content = {
  id: "1",
  name: "쌍계사",
  region: "HADONG",
  category: "CULTURE",
  imageUrl: null,
  address: "경남 하동군",
  summary: "천년 고찰",
  indoor: false,
};

// 캘린더가 기본으로 오늘이 속한 달을 보여주므로, 월 이동 없이 바로
// 클릭할 수 있는 "오늘"을 출발일로 고른다(과거 날짜는 선택 불가라 today가
// 안전한 최소값이다).
async function pickToday() {
  const today = new Date();
  await userEvent.click(
    screen.getByRole("button", { name: String(today.getDate()) }),
  );
}

describe("TravelDateForm — 바구니 초기화", () => {
  beforeEach(() => {
    localStorage.clear();
    useBasketStore.setState({ items: [], hydrated: false });
  });

  it("마운트 시 이전 여행 계획에서 남은 바구니를 비운다", () => {
    useBasketStore.setState({
      items: [{ content: stub, addedAt: Date.now(), priority: null }],
      hydrated: true,
    });

    render(<TravelDateForm regions="HADONG" />);

    expect(useBasketStore.getState().items).toHaveLength(0);
  });
});

describe("TravelDateForm — 동행 조건", () => {
  it("동행 조건 선택 섹션이 화면에 렌더된다", () => {
    render(<TravelDateForm regions="HADONG" />);

    expect(screen.getAllByText("동행 조건").length).toBeGreaterThan(0);
  });

  it("동행 조건을 선택하지 않아도 날짜·기간 입력 시 다음 버튼이 활성화된다", async () => {
    render(<TravelDateForm regions="HADONG" />);

    await pickToday();
    await userEvent.click(screen.getByRole("button", { name: "당일치기" }));

    expect(screen.getByRole("button", { name: "다음" })).toBeEnabled();
  });

  it("동행 조건 선택 시 URL에 companions 파라미터가 포함된다", async () => {
    render(<TravelDateForm regions="HADONG" />);

    await pickToday();
    await userEvent.click(screen.getByRole("button", { name: "당일치기" }));
    await userEvent.click(screen.getByRole("button", { name: "아이와 함께" }));
    await userEvent.click(screen.getByRole("button", { name: "다음" }));

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("companions=WITH_KIDS"),
    );
  });

  it("동행 조건 미선택 시 URL에 companions 파라미터가 없다", async () => {
    mockPush.mockClear();
    render(<TravelDateForm regions="HADONG" />);

    await pickToday();
    await userEvent.click(screen.getByRole("button", { name: "당일치기" }));
    await userEvent.click(screen.getByRole("button", { name: "다음" }));

    expect(mockPush).toHaveBeenCalledWith(
      expect.not.stringContaining("companions"),
    );
  });
});
