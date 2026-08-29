import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockSearchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
}));

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
    mockSearchParams = new URLSearchParams();
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

  it("지역 탭 전환 시 그 지역으로만 getContents를 호출하고, 이전 지역 카드는 사라진다", async () => {
    mockGetContents.mockResolvedValueOnce({
      contents: [makeContent({ id: "2", name: "부석사", region: "YEONGJU" })],
      total: 1,
    });

    renderExploreGrid({
      initialContents: [
        makeContent({ id: "1", name: "쌍계사", region: "HADONG" }),
      ],
    });

    await userEvent.click(screen.getByRole("tab", { name: "영주" }));

    await waitFor(() =>
      expect(mockGetContents).toHaveBeenCalledWith({
        ...defaultQueryParams,
        regions: ["YEONGJU"],
        page: 0,
        size: 20,
      }),
    );
    await waitFor(() => expect(screen.getByText("부석사")).toBeInTheDocument());
    expect(screen.queryByText("쌍계사")).not.toBeInTheDocument();
  });

  it("initialTotal이 initialContents.length보다 크면 더보기 버튼이 보인다", () => {
    renderExploreGrid({
      initialContents: [makeContent({ id: "1" })],
      initialTotal: 3,
    });

    expect(screen.getByRole("button", { name: /더보기/ })).toBeInTheDocument();
  });

  it("initialTotal이 initialContents.length와 같으면 완료 문구가 보인다", () => {
    renderExploreGrid({
      initialContents: [makeContent({ id: "1" })],
      initialTotal: 1,
    });

    expect(
      screen.queryByRole("button", { name: /더보기/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/모두 확인했어요/)).toBeInTheDocument();
  });

  it("더보기 클릭 시 다음 페이지를 요청하고 결과를 끝에 이어붙인다", async () => {
    mockGetContents.mockResolvedValueOnce({
      contents: [makeContent({ id: "2", name: "화개장터" })],
      total: 2,
    });

    renderExploreGrid({
      initialContents: [makeContent({ id: "1", name: "쌍계사" })],
      initialTotal: 2,
    });

    await userEvent.click(screen.getByRole("button", { name: /더보기/ }));

    // size는 항상 CONTENT_PAGE_SIZE(20)로 넘긴다 — getContents가 지역별로
    // 쪼개므로("전체" 탭이어도) 한 페이지 합계는 20으로 유지된다.
    expect(mockGetContents).toHaveBeenCalledWith({
      ...defaultQueryParams,
      page: 1,
      size: 20,
    });
    await waitFor(() =>
      expect(screen.getByText("화개장터")).toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(screen.getByText(/모두 확인했어요/)).toBeInTheDocument(),
    );

    const names = screen
      .getAllByRole("heading", { level: 3 })
      .map((h) => h.textContent);
    expect(names).toEqual(["쌍계사", "화개장터"]);
  });

  it("카테고리 필터를 선택하면 남은 페이지를 자동으로 받아와 그 카테고리 개수 기준으로 완료 문구를 보여준다", async () => {
    mockGetContents.mockResolvedValueOnce({
      contents: [
        makeContent({ id: "3", name: "재첩국3", category: "FOOD" }),
        makeContent({ id: "4", name: "화개장터", category: "CULTURE" }),
      ],
      total: 5,
    });

    renderExploreGrid({
      initialContents: [
        makeContent({ id: "1", name: "재첩국1", category: "FOOD" }),
        makeContent({ id: "2", name: "쌍계사", category: "CULTURE" }),
        makeContent({ id: "5", name: "재첩국2", category: "FOOD" }),
      ],
      initialTotal: 5,
    });

    await userEvent.click(screen.getByRole("button", { name: "음식" }));

    // 사용자가 "더보기"를 누르지 않아도 필터가 걸리자마자 남은 페이지를
    // 자동으로(백그라운드로) 받아온다.
    await waitFor(() =>
      expect(mockGetContents).toHaveBeenCalledWith({
        ...defaultQueryParams,
        page: 1,
        size: 20,
      }),
    );

    // 완료 문구는 전체 total(5)이 아니라 필터링된 개수(FOOD 3개) 기준이다.
    await waitFor(() =>
      expect(screen.getByText("3개를 모두 확인했어요")).toBeInTheDocument(),
    );
    expect(screen.getByText("재첩국1")).toBeInTheDocument();
    expect(screen.getByText("재첩국2")).toBeInTheDocument();
    expect(screen.getByText("재첩국3")).toBeInTheDocument();
    expect(screen.queryByText("쌍계사")).not.toBeInTheDocument();
    expect(screen.queryByText("화개장터")).not.toBeInTheDocument();

    // 결과 헤더는 카테고리 정적 총계(음식 전 지역 53개)와 화면에 보여준 수를 함께 보여준다.
    await waitFor(() =>
      expect(screen.getByText("음식 53개 중 3개 표시 중")).toBeInTheDocument(),
    );
  });

  it("URL의 ?cat= 로 진입하면 그 카테고리 필터가 적용된 채로 뜬다", () => {
    mockSearchParams = new URLSearchParams("cat=FOOD");
    renderExploreGrid({
      initialContents: [
        makeContent({ id: "1", name: "재첩국", category: "FOOD" }),
        makeContent({ id: "2", name: "쌍계사", category: "CULTURE" }),
      ],
      initialTotal: 2,
    });

    expect(screen.getByText("재첩국")).toBeInTheDocument();
    expect(screen.queryByText("쌍계사")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "음식" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("카테고리를 고르면 URL 쿼리(?cat=)에 반영한다", async () => {
    const replaceState = vi.spyOn(window.history, "replaceState");
    renderExploreGrid({
      initialContents: [makeContent({ id: "1", category: "CULTURE" })],
    });

    await userEvent.click(screen.getByRole("button", { name: "문화" }));

    expect(replaceState).toHaveBeenCalledWith(null, "", "?cat=CULTURE");
  });

  it("검색어가 있으면 정적 총계 대신 기존 '불러온 N개 중 M개' 문구를 쓴다", async () => {
    renderExploreGrid({
      initialContents: [
        makeContent({ id: "1", name: "재첩국", category: "FOOD" }),
        makeContent({ id: "2", name: "쌍계사", category: "CULTURE" }),
      ],
      initialTotal: 2,
    });

    await userEvent.type(screen.getByRole("searchbox"), "재첩");

    expect(screen.getByText("불러온 2개 중 1개")).toBeInTheDocument();
  });

  it("필터링된 개수가 한 페이지 분량을 넘으면 더보기가 그 개수만큼만 늘고 중복 없이 끝난다", async () => {
    // FOOD 19개 + CULTURE 1개 = 20개를 초기 페이지로, FOOD 3개를 다음
    // 페이지로 받는다 — 전체 23개 중 FOOD는 22개.
    const initialContents = [
      ...Array.from({ length: 19 }, (_, i) =>
        makeContent({ id: `f${i}`, name: `재첩국${i}`, category: "FOOD" }),
      ),
      makeContent({ id: "c0", name: "쌍계사", category: "CULTURE" }),
    ];
    const nextPageContents = Array.from({ length: 3 }, (_, i) =>
      makeContent({
        id: `f${19 + i}`,
        name: `재첩국${19 + i}`,
        category: "FOOD",
      }),
    );
    mockGetContents.mockResolvedValueOnce({
      contents: nextPageContents,
      total: 23,
    });

    renderExploreGrid({ initialContents, initialTotal: 23 });

    await userEvent.click(screen.getByRole("button", { name: "음식" }));

    // 백그라운드 로딩이 끝나면(총 22개 FOOD 확보) 페이지 크기(20)를 넘긴
    // 만큼만 "더보기"로 남는다.
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /더보기/ })).toHaveTextContent(
        "2개 더보기",
      ),
    );
    expect(screen.getAllByText(/^재첩국\d+$/)).toHaveLength(20);
    expect(screen.queryByText("쌍계사")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /더보기/ }));

    await waitFor(() =>
      expect(screen.getByText("22개를 모두 확인했어요")).toBeInTheDocument(),
    );
    // 새로 펼쳐진 뒤에도 중복 없이 정확히 22장만 보인다.
    expect(screen.getAllByText(/^재첩국\d+$/)).toHaveLength(22);
  });

  it("카테고리를 여러 개 선택하면 로드 순서와 무관하게 카테고리 선언 순서로 묶여서 보인다", async () => {
    // 로드 순서는 문화-음식-문화-음식으로 일부러 뒤섞는다.
    const contents = [
      makeContent({ id: "c1", name: "문화1", category: "CULTURE" }),
      makeContent({ id: "f1", name: "음식1", category: "FOOD" }),
      makeContent({ id: "c2", name: "문화2", category: "CULTURE" }),
      makeContent({ id: "f2", name: "음식2", category: "FOOD" }),
    ];

    renderExploreGrid({ initialContents: contents, initialTotal: 4 });

    await userEvent.click(screen.getByRole("button", { name: "음식" }));
    await userEvent.click(screen.getByRole("button", { name: "문화" }));

    // CONTENT_CATEGORIES 선언 순서(FOOD가 CULTURE보다 앞)대로 묶이고,
    // 같은 카테고리 안에서는 원래 로드 순서를 유지한다.
    const names = screen
      .getAllByRole("heading", { level: 3 })
      .map((h) => h.textContent);
    expect(names).toEqual(["음식1", "음식2", "문화1", "문화2"]);
  });
});
