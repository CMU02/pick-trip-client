import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/contentService", () => ({
  getContents: vi.fn(),
}));

import { getContents } from "@/services/contentService";
import type { Content } from "@/types/content";

import { ExploreGrid } from "./ExploreGrid";

const mockGetContents = vi.mocked(getContents);

const makeContent = (overrides: Partial<Content> = {}): Content => ({
  id: "1",
  name: "쌍계사",
  region: "HADONG",
  category: "CULTURE",
  imageUrl: null,
  address: "경남 하동군 화개면",
  summary: "천년 고찰",
  indoor: false,
  ...overrides,
});

const defaultQueryParams = {
  regions: ["HADONG", "YEONGJU", "YECHEON"],
  startDate: "2026-06-20",
  nights: 0,
};

// ExploreGrid는 useLoadMoreContents(useInfiniteQuery)를 쓰므로 로컬
// QueryClientProvider로 감싸야 한다. initialTotal은 기본적으로
// initialContents.length와 같게 줘서(더 불러올 게 없는 상태) 더보기 버튼과
// 무관한 기존 필터 테스트들이 그대로 통과하게 한다.
function renderExploreGrid({
  initialContents,
  initialTotal = initialContents.length,
  queryParams = defaultQueryParams,
}: {
  initialContents: Content[];
  initialTotal?: number;
  queryParams?: typeof defaultQueryParams;
}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ExploreGrid
        initialContents={initialContents}
        initialTotal={initialTotal}
        queryParams={queryParams}
      />
    </QueryClientProvider>,
  );
}

describe("ExploreGrid", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("지역 필터 선택 시 해당 지역 콘텐츠만 표시된다", async () => {
    const contents = [
      makeContent({ id: "1", name: "쌍계사", region: "HADONG" }),
      makeContent({ id: "2", name: "부석사", region: "YEONGJU" }),
    ];

    renderExploreGrid({ initialContents: contents });

    await userEvent.click(screen.getByRole("button", { name: "하동" }));

    expect(screen.getByText("쌍계사")).toBeInTheDocument();
    expect(screen.queryByText("부석사")).not.toBeInTheDocument();
  });

  it("지역 필터와 카테고리 필터를 동시에 적용하면 두 조건을 모두 만족하는 콘텐츠만 표시된다", async () => {
    const contents = [
      makeContent({
        id: "1",
        name: "쌍계사",
        region: "HADONG",
        category: "CULTURE",
      }),
      makeContent({
        id: "2",
        name: "하동 재첩국",
        region: "HADONG",
        category: "FOOD",
      }),
      makeContent({
        id: "3",
        name: "부석사",
        region: "YEONGJU",
        category: "CULTURE",
      }),
    ];

    renderExploreGrid({ initialContents: contents });

    await userEvent.click(screen.getByRole("button", { name: "하동" }));
    await userEvent.click(screen.getByRole("button", { name: "문화" }));

    expect(screen.getByText("쌍계사")).toBeInTheDocument();
    expect(screen.queryByText("하동 재첩국")).not.toBeInTheDocument();
    expect(screen.queryByText("부석사")).not.toBeInTheDocument();
  });

  it("전달받은 콘텐츠 카드를 모두 렌더한다", () => {
    const contents = [
      makeContent({ id: "1", name: "쌍계사" }),
      makeContent({ id: "2", name: "하동 재첩국", category: "FOOD" }),
    ];

    renderExploreGrid({ initialContents: contents });

    expect(screen.getByText("쌍계사")).toBeInTheDocument();
    expect(screen.getByText("하동 재첩국")).toBeInTheDocument();
  });

  it("카테고리 필터 선택 시 해당 카테고리만 표시된다", async () => {
    const contents = [
      makeContent({ id: "1", name: "쌍계사", category: "CULTURE" }),
      makeContent({ id: "2", name: "하동 재첩국", category: "FOOD" }),
    ];

    renderExploreGrid({ initialContents: contents });

    await userEvent.click(screen.getByRole("button", { name: "문화" }));

    expect(screen.getByText("쌍계사")).toBeInTheDocument();
    expect(screen.queryByText("하동 재첩국")).not.toBeInTheDocument();
  });

  it("검색어 입력 시 이름이 일치하는 카드만 표시된다", async () => {
    const contents = [
      makeContent({ id: "1", name: "쌍계사" }),
      makeContent({ id: "2", name: "하동 재첩국", category: "FOOD" }),
    ];

    renderExploreGrid({ initialContents: contents });

    await userEvent.type(screen.getByRole("searchbox"), "쌍계");

    expect(screen.getByText("쌍계사")).toBeInTheDocument();
    expect(screen.queryByText("하동 재첩국")).not.toBeInTheDocument();
  });

  it("필터 결과가 없을 때 빈 상태 메시지를 표시한다", async () => {
    renderExploreGrid({
      initialContents: [makeContent({ name: "쌍계사" })],
    });

    await userEvent.type(screen.getByRole("searchbox"), "없는콘텐츠xyz");

    expect(
      screen.getByText(/조건에 맞는 콘텐츠가 없습니다/),
    ).toBeInTheDocument();
  });

  it("콘텐츠가 없을 때 빈 상태 메시지를 표시한다", () => {
    renderExploreGrid({ initialContents: [] });

    expect(screen.getByText(/콘텐츠가 없습니다/)).toBeInTheDocument();
  });

  it("콘텐츠를 카테고리별 섹션으로 나누어 표시한다", () => {
    const contents = [
      makeContent({ id: "1", name: "쌍계사", category: "CULTURE" }),
      makeContent({ id: "2", name: "화개장터", category: "CULTURE" }),
      makeContent({ id: "3", name: "하동 재첩국", category: "FOOD" }),
    ];

    renderExploreGrid({ initialContents: contents });

    expect(screen.getByRole("heading", { name: /문화/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /음식/ })).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: /문화/ })).toHaveTextContent(
      "2개",
    );
    expect(screen.getByRole("heading", { name: /음식/ })).toHaveTextContent(
      "1개",
    );
  });

  it("카테고리가 없는 콘텐츠는 기타 섹션으로 묶인다", () => {
    renderExploreGrid({
      initialContents: [
        makeContent({ id: "1", name: "쌍계사", category: undefined }),
      ],
    });

    expect(screen.getByRole("heading", { name: /기타/ })).toBeInTheDocument();
  });

  it("카테고리 필터 적용 시 선택한 카테고리 섹션만 표시된다", async () => {
    const contents = [
      makeContent({ id: "1", name: "쌍계사", category: "CULTURE" }),
      makeContent({ id: "2", name: "하동 재첩국", category: "FOOD" }),
    ];

    renderExploreGrid({ initialContents: contents });

    await userEvent.click(screen.getByRole("button", { name: "문화" }));

    expect(screen.getByRole("heading", { name: /문화/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /음식/ }),
    ).not.toBeInTheDocument();
  });

  it("initialTotal이 initialContents.length보다 크면 더보기 버튼이 보인다", () => {
    renderExploreGrid({
      initialContents: [makeContent({ id: "1" })],
      initialTotal: 3,
    });

    expect(screen.getByRole("button", { name: /더보기/ })).toBeInTheDocument();
  });

  it("initialTotal이 initialContents.length와 같으면 더보기 버튼이 보이지 않는다", () => {
    renderExploreGrid({
      initialContents: [makeContent({ id: "1" })],
      initialTotal: 1,
    });

    expect(
      screen.queryByRole("button", { name: /더보기/ }),
    ).not.toBeInTheDocument();
  });

  it("더보기 클릭 시 다음 페이지를 요청하고 결과를 이어붙인다", async () => {
    mockGetContents.mockResolvedValueOnce({
      contents: [makeContent({ id: "2", name: "화개장터" })],
      total: 2,
    });

    renderExploreGrid({
      initialContents: [makeContent({ id: "1", name: "쌍계사" })],
      initialTotal: 2,
    });

    await userEvent.click(screen.getByRole("button", { name: /더보기/ }));

    expect(mockGetContents).toHaveBeenCalledWith({
      ...defaultQueryParams,
      page: 1,
      size: 20,
    });
    await waitFor(() =>
      expect(screen.getByText("화개장터")).toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /더보기/ }),
      ).not.toBeInTheDocument(),
    );
  });
});
