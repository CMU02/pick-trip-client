import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useBasketStore } from "@/stores/basketStore";
import type { BasketPriority } from "@/types/basket";
import type { Content } from "@/types/content";

import { PreGenerateView } from "./PreGenerateView";

function content(
  id: string,
  name: string,
  extra: Partial<Content> = {},
): Content {
  return {
    id,
    name,
    region: "HADONG",
    category: "CULTURE",
    imageUrl: null,
    address: "경남 하동군",
    ...extra,
  };
}

function setBasket(
  items: { content: Content; priority: BasketPriority | null }[],
) {
  useBasketStore.setState({
    items: items.map((i) => ({ ...i, addedAt: Date.now() })),
    hydrated: true,
  });
}

const baseProps = {
  regions: "HADONG",
  startDate: "2026-09-12",
  nights: "1",
  companions: "LESS_WALKING",
  onGenerate: vi.fn(),
  error: null,
};

beforeEach(() => {
  localStorage.clear();
  useBasketStore.setState({ items: [], hydrated: false });
  baseProps.onGenerate = vi.fn();
});

describe("PreGenerateView — 여행 조건 표시", () => {
  it("지역·출발일·기간·동행 조건을 사람이 읽는 라벨로 보여준다", () => {
    setBasket([
      { content: content("1", "쌍계사"), priority: "MUST" },
      { content: content("2", "화개장터"), priority: null },
    ]);

    render(<PreGenerateView {...baseProps} />);

    expect(screen.getAllByText("하동").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/9월 12일/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("1박 2일").length).toBeGreaterThan(0);
    expect(screen.getAllByText("걷기 적게").length).toBeGreaterThan(0);
  });

  it("지역·출발일이 비면 NaN 대신 '미선택'을 표시하고 생성 버튼을 비활성화한다", () => {
    setBasket([
      { content: content("1", "쌍계사"), priority: "MUST" },
      { content: content("2", "화개장터"), priority: "SHOULD" },
    ]);

    render(
      <PreGenerateView {...baseProps} regions="" startDate="" nights="0" />,
    );

    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
    expect(screen.getAllByText("미선택").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: "일정 생성하기" }),
    ).toBeDisabled();
  });
});

describe("PreGenerateView — 생성 버튼 활성 조건", () => {
  it("지역·출발일이 있고 담은 콘텐츠가 2개 이상이면 활성화되고 클릭 시 onGenerate를 호출한다", async () => {
    setBasket([
      { content: content("1", "쌍계사"), priority: "MUST" },
      { content: content("2", "화개장터"), priority: null },
    ]);

    render(<PreGenerateView {...baseProps} />);

    const button = screen.getByRole("button", { name: "일정 생성하기" });
    expect(button).toBeEnabled();

    await userEvent.click(button);
    expect(baseProps.onGenerate).toHaveBeenCalledTimes(1);
  });

  it("담은 콘텐츠가 1개면 비활성화된다", () => {
    setBasket([{ content: content("1", "쌍계사"), priority: "MUST" }]);

    render(<PreGenerateView {...baseProps} />);

    expect(
      screen.getByRole("button", { name: "일정 생성하기" }),
    ).toBeDisabled();
  });
});

describe("PreGenerateView — 담은 콘텐츠", () => {
  it("우선순위별로 그룹을 나누고 빈 그룹은 숨긴다", () => {
    setBasket([
      { content: content("1", "쌍계사"), priority: "MUST" },
      { content: content("2", "화개장터"), priority: "OPTIONAL" },
    ]);

    render(<PreGenerateView {...baseProps} />);

    expect(screen.getByText("꼭 가기")).toBeInTheDocument();
    expect(screen.getByText("선택")).toBeInTheDocument();
    expect(screen.queryByText("가면 좋음")).not.toBeInTheDocument();
    expect(screen.getByText("쌍계사")).toBeInTheDocument();
    expect(screen.getByText("화개장터")).toBeInTheDocument();
  });

  it("항목 삭제 버튼을 누르면 바구니에서 제거된다", async () => {
    setBasket([
      { content: content("1", "쌍계사"), priority: "MUST" },
      { content: content("2", "화개장터"), priority: "SHOULD" },
    ]);

    render(<PreGenerateView {...baseProps} />);

    await userEvent.click(screen.getByRole("button", { name: "쌍계사 삭제" }));

    expect(useBasketStore.getState().items).toHaveLength(1);
    expect(screen.queryByText("쌍계사")).not.toBeInTheDocument();
  });

  it("바구니가 비면 빈 상태 안내와 콘텐츠 둘러보기 링크를 보여준다", () => {
    setBasket([]);

    render(<PreGenerateView {...baseProps} />);

    expect(screen.getByText("담은 콘텐츠가 없습니다")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /콘텐츠 둘러보기/ }),
    ).toBeInTheDocument();
  });
});

describe("PreGenerateView — 파생 지표", () => {
  it("담은 콘텐츠 수, 여행 기간(=박+1), 하루 평균 장소 수를 계산해 보여준다", () => {
    setBasket([
      { content: content("1", "쌍계사"), priority: "MUST" },
      { content: content("2", "화개장터"), priority: null },
      { content: content("3", "최참판댁"), priority: "SHOULD" },
    ]);

    render(<PreGenerateView {...baseProps} nights="1" />);

    // 담은 콘텐츠 3개
    expect(screen.getAllByText("3").length).toBeGreaterThan(0);
    // 여행 기간 2일 (1박 + 1)
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
    // 하루 평균 2곳 (round(3 / 2))
  });
});

describe("PreGenerateView — 오류 상태", () => {
  it("error가 있으면 메시지와 다시 시도 버튼을 보여주고 클릭 시 onGenerate를 호출한다", async () => {
    setBasket([
      { content: content("1", "쌍계사"), priority: "MUST" },
      { content: content("2", "화개장터"), priority: null },
    ]);

    render(
      <PreGenerateView
        {...baseProps}
        error={{ message: "일시적인 오류가 발생했습니다.", traceId: "abc123" }}
      />,
    );

    expect(
      screen.getByText("일시적인 오류가 발생했습니다."),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(baseProps.onGenerate).toHaveBeenCalled();
  });
});
