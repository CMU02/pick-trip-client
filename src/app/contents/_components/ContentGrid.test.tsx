import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

vi.mock("@/services/contentService", () => ({
  getContents: vi.fn(),
}));

import { getContents } from "@/services/contentService";
import { useBasketStore } from "@/stores/basketStore";
import type { Content } from "@/types/content";

import { ContentGrid } from "./ContentGrid";

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

const defaultItineraryHref =
  "/itinerary?regions=HADONG&startDate=2026-06-20&nights=1";
const defaultConditionLine = "하동 · 2026년 6월 20일 (토) · 1박 2일";
const defaultQueryParams = {
  regions: ["HADONG"],
  startDate: "2026-06-20",
  nights: 1,
};

// ContentGrid는 useLoadMoreContents(useInfiniteQuery)를 쓰므로 로컬
// QueryClientProvider로 감싸야 한다. initialTotal은 기본적으로
// initialContents.length와 같게 줘서(더 불러올 게 없는 상태) 더보기 버튼과
// 무관한 기존 필터 테스트들이 그대로 통과하게 한다.
function renderContentGrid({
  initialContents,
  initialTotal = initialContents.length,
  queryParams = defaultQueryParams,
  itineraryHref = defaultItineraryHref,
  conditionLine = defaultConditionLine,
}: {
  initialContents: Content[];
  initialTotal?: number;
  queryParams?: typeof defaultQueryParams;
  itineraryHref?: string;
  conditionLine?: string;
}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ContentGrid
        initialContents={initialContents}
        initialTotal={initialTotal}
        queryParams={queryParams}
        itineraryHref={itineraryHref}
        conditionLine={conditionLine}
      />
    </QueryClientProvider>,
  );
}

describe("ContentGrid", () => {
  beforeEach(() => {
    localStorage.clear();
    // 전역 바구니 스토어는 테스트 간 상태가 누수되므로 초기 상태로 리셋한다.
    useBasketStore.setState({ items: [], hydrated: false });
    vi.resetAllMocks();
  });

  it("지역 필터 선택 시 해당 지역 콘텐츠만 표시된다", async () => {
    const contents = [
      makeContent({ id: "1", name: "쌍계사", region: "HADONG" }),
      makeContent({ id: "2", name: "부석사", region: "YEONGJU" }),
    ];

    renderContentGrid({ initialContents: contents });

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

    renderContentGrid({ initialContents: contents });

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

    renderContentGrid({ initialContents: contents });

    expect(screen.getByText("쌍계사")).toBeInTheDocument();
    expect(screen.getByText("하동 재첩국")).toBeInTheDocument();
  });

  it("카테고리 필터 선택 시 해당 카테고리만 표시된다", async () => {
    const contents = [
      makeContent({ id: "1", name: "쌍계사", category: "CULTURE" }),
      makeContent({ id: "2", name: "하동 재첩국", category: "FOOD" }),
    ];

    renderContentGrid({ initialContents: contents });

    await userEvent.click(screen.getByRole("button", { name: "문화" }));

    expect(screen.getByText("쌍계사")).toBeInTheDocument();
    expect(screen.queryByText("하동 재첩국")).not.toBeInTheDocument();
  });

  it("검색어 입력 시 이름이 일치하는 카드만 표시된다", async () => {
    const contents = [
      makeContent({ id: "1", name: "쌍계사" }),
      makeContent({ id: "2", name: "하동 재첩국", category: "FOOD" }),
    ];

    renderContentGrid({ initialContents: contents });

    await userEvent.type(screen.getByRole("searchbox"), "쌍계");

    expect(screen.getByText("쌍계사")).toBeInTheDocument();
    expect(screen.queryByText("하동 재첩국")).not.toBeInTheDocument();
  });

  it("필터 결과가 없을 때 빈 상태 메시지를 표시한다", async () => {
    renderContentGrid({
      initialContents: [makeContent({ name: "쌍계사" })],
    });

    await userEvent.type(screen.getByRole("searchbox"), "없는콘텐츠xyz");

    expect(
      screen.getByText(/조건에 맞는 콘텐츠가 없습니다/),
    ).toBeInTheDocument();
  });

  it("콘텐츠가 없을 때 빈 상태 메시지를 표시한다", () => {
    renderContentGrid({ initialContents: [] });

    expect(screen.getByText(/콘텐츠가 없습니다/)).toBeInTheDocument();
  });

  it("콘텐츠를 카테고리별 섹션으로 나누어 표시한다", () => {
    const contents = [
      makeContent({ id: "1", name: "쌍계사", category: "CULTURE" }),
      makeContent({ id: "2", name: "화개장터", category: "CULTURE" }),
      makeContent({ id: "3", name: "하동 재첩국", category: "FOOD" }),
    ];

    renderContentGrid({ initialContents: contents });

    expect(screen.getByRole("heading", { name: /문화/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /음식/ })).toBeInTheDocument();

    const cultureHeading = screen.getByRole("heading", { name: /문화/ });
    expect(cultureHeading).toHaveTextContent("2개");

    const foodHeading = screen.getByRole("heading", { name: /음식/ });
    expect(foodHeading).toHaveTextContent("1개");
  });

  it("카테고리가 없는 콘텐츠는 기타 섹션으로 묶인다", () => {
    const contents = [
      makeContent({ id: "1", name: "쌍계사", category: undefined }),
    ];

    renderContentGrid({ initialContents: contents });

    expect(screen.getByRole("heading", { name: /기타/ })).toBeInTheDocument();
  });

  it("담기 버튼 클릭 시 새로고침 없이 담김으로 즉시 바뀐다", async () => {
    renderContentGrid({
      initialContents: [makeContent({ id: "1", name: "쌍계사" })],
    });

    await userEvent.click(screen.getByRole("button", { name: "담기" }));

    expect(screen.getByRole("button", { name: "담김" })).toBeInTheDocument();
  });

  it("담김 버튼을 다시 누르면 담기로 즉시 바뀐다", async () => {
    renderContentGrid({
      initialContents: [makeContent({ id: "1", name: "쌍계사" })],
    });

    await userEvent.click(screen.getByRole("button", { name: "담기" }));
    await userEvent.click(screen.getByRole("button", { name: "담김" }));

    expect(screen.getByRole("button", { name: "담기" })).toBeInTheDocument();
  });

  it("카테고리 필터 적용 시 선택한 카테고리 섹션만 표시된다", async () => {
    const contents = [
      makeContent({ id: "1", name: "쌍계사", category: "CULTURE" }),
      makeContent({ id: "2", name: "하동 재첩국", category: "FOOD" }),
    ];

    renderContentGrid({ initialContents: contents });

    await userEvent.click(screen.getByRole("button", { name: "문화" }));

    expect(screen.getByRole("heading", { name: /문화/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /음식/ }),
    ).not.toBeInTheDocument();
  });

  it("initialTotal이 initialContents.length보다 크면 더보기 버튼이 보인다", () => {
    renderContentGrid({
      initialContents: [makeContent({ id: "1" })],
      initialTotal: 3,
    });

    expect(screen.getByRole("button", { name: /더보기/ })).toBeInTheDocument();
  });

  it("initialTotal이 initialContents.length와 같으면 더보기 버튼이 보이지 않는다", () => {
    renderContentGrid({
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

    renderContentGrid({
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
    // 다 불러온 뒤(2/2)에는 버튼이 사라진다.
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /더보기/ }),
      ).not.toBeInTheDocument(),
    );
  });

  it("더보기 요청이 실패하면 에러 메시지를 표시한다", async () => {
    mockGetContents.mockRejectedValueOnce(
      new Error("콘텐츠를 더 불러오지 못했습니다."),
    );

    renderContentGrid({
      initialContents: [makeContent({ id: "1" })],
      initialTotal: 2,
    });

    await userEvent.click(screen.getByRole("button", { name: /더보기/ }));

    expect(await screen.findByText(/오류가 발생했습니다/)).toBeInTheDocument();
  });
});
