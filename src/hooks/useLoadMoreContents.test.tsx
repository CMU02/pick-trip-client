import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/errors";
import type { Content, ContentsResponse } from "@/types/content";

vi.mock("@/services/contentService", () => ({
  getContents: vi.fn(),
}));

import { getContents } from "@/services/contentService";
import { useLoadMoreContents } from "./useLoadMoreContents";

const mockGetContents = vi.mocked(getContents);

const makeContent = (id: string): Content => ({
  id,
  name: `콘텐츠 ${id}`,
  region: "HADONG",
  imageUrl: null,
  address: "경남 하동군",
});

// 각 테스트는 독립된 QueryClient를 쓴다.
function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

const queryParams = {
  regions: ["HADONG"],
  startDate: "2026-08-01",
  nights: 1,
};

describe("useLoadMoreContents", () => {
  beforeEach(() => {
    // clearAllMocks는 호출 기록만 지우고 mockResolvedValueOnce 등으로 예약해둔
    // once 구현은 남기므로, 테스트 간 큐가 새는 걸 막기 위해 완전히 리셋한다.
    vi.resetAllMocks();
  });

  it("초기 상태는 전달받은 initialContents/initialTotal을 그대로 노출한다", () => {
    const { result } = renderHook(
      () =>
        useLoadMoreContents({
          queryKey: ["contents", queryParams],
          queryParams,
          initialContents: [makeContent("1"), makeContent("2")],
          initialTotal: 5,
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.contents).toHaveLength(2);
    expect(result.current.total).toBe(5);
    expect(result.current.hasMore).toBe(true);
    expect(mockGetContents).not.toHaveBeenCalled();
  });

  it("loadMore 호출 시 다음 페이지 결과가 기존 목록 뒤에 이어붙는다", async () => {
    mockGetContents.mockResolvedValueOnce({
      contents: [makeContent("3")],
      total: 3,
    } satisfies ContentsResponse);

    const { result } = renderHook(
      () =>
        useLoadMoreContents({
          queryKey: ["contents", queryParams],
          queryParams,
          initialContents: [makeContent("1"), makeContent("2")],
          initialTotal: 3,
        }),
      { wrapper: createWrapper() },
    );

    act(() => result.current.loadMore());

    await waitFor(() => expect(result.current.contents).toHaveLength(3));
    expect(result.current.contents.map((c) => c.id)).toEqual(["1", "2", "3"]);
    expect(mockGetContents).toHaveBeenCalledWith({
      ...queryParams,
      page: 1,
      size: 20,
    });
  });

  it("응답에 중복 id가 포함돼도 최종 contents에는 한 번만 남는다", async () => {
    mockGetContents.mockResolvedValueOnce({
      contents: [makeContent("2"), makeContent("3")],
      total: 3,
    } satisfies ContentsResponse);

    const { result } = renderHook(
      () =>
        useLoadMoreContents({
          queryKey: ["contents", queryParams],
          queryParams,
          initialContents: [makeContent("1"), makeContent("2")],
          initialTotal: 3,
        }),
      { wrapper: createWrapper() },
    );

    act(() => result.current.loadMore());

    await waitFor(() => expect(result.current.contents).toHaveLength(3));
    expect(result.current.contents.map((c) => c.id)).toEqual(["1", "2", "3"]);
  });

  it("로드된 개수가 total에 도달하면 hasMore가 false가 된다", async () => {
    mockGetContents.mockResolvedValueOnce({
      contents: [makeContent("2")],
      total: 2,
    } satisfies ContentsResponse);

    const { result } = renderHook(
      () =>
        useLoadMoreContents({
          queryKey: ["contents", queryParams],
          queryParams,
          initialContents: [makeContent("1")],
          initialTotal: 2,
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.hasMore).toBe(true);
    act(() => result.current.loadMore());

    await waitFor(() => expect(result.current.hasMore).toBe(false));
  });

  it("일부 지역이 소진돼 빈 페이지를 받으면 예외 없이 처리되고 더 요청하지 않는다", async () => {
    mockGetContents.mockResolvedValueOnce({
      contents: [],
      total: 1,
    } satisfies ContentsResponse);

    const { result } = renderHook(
      () =>
        useLoadMoreContents({
          queryKey: ["contents", queryParams],
          queryParams,
          initialContents: [makeContent("1")],
          initialTotal: 5,
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.hasMore).toBe(true);
    act(() => result.current.loadMore());

    await waitFor(() => expect(mockGetContents).toHaveBeenCalledTimes(1));
    expect(result.current.hasMore).toBe(false);
    expect(result.current.contents).toHaveLength(1);
  });

  it("API 호출이 실패하면 errorMessage가 채워지고 isLoadingMore는 false로 돌아온다", async () => {
    mockGetContents.mockRejectedValueOnce(
      new ApiError(500, "콘텐츠를 더 불러오지 못했습니다."),
    );

    const { result } = renderHook(
      () =>
        useLoadMoreContents({
          queryKey: ["contents", queryParams],
          queryParams,
          initialContents: [makeContent("1")],
          initialTotal: 5,
        }),
      { wrapper: createWrapper() },
    );

    act(() => result.current.loadMore());

    await waitFor(() =>
      expect(result.current.errorMessage).toBe(
        "콘텐츠를 더 불러오지 못했습니다.",
      ),
    );
    expect(result.current.isLoadingMore).toBe(false);
  });

  it("initialContents/initialTotal을 넘기지 않으면 마운트 즉시 0페이지를 요청한다", async () => {
    mockGetContents.mockResolvedValueOnce({
      contents: [makeContent("1")],
      total: 1,
    } satisfies ContentsResponse);

    const { result } = renderHook(
      () =>
        useLoadMoreContents({
          queryKey: ["contents", queryParams],
          queryParams,
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.contents).toHaveLength(0);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockGetContents).toHaveBeenCalledWith({
      ...queryParams,
      page: 0,
      size: 20,
    });
    expect(result.current.contents.map((c) => c.id)).toEqual(["1"]);
  });

  it("queryKey가 바뀌면(검색 조건 변경) 누적 상태가 새 초기값으로 리셋된다", () => {
    const { result, rerender } = renderHook(
      ({ initialContents, initialTotal, key }) =>
        useLoadMoreContents({
          queryKey: ["contents", key],
          queryParams,
          initialContents,
          initialTotal,
        }),
      {
        wrapper: createWrapper(),
        initialProps: {
          initialContents: [makeContent("1")],
          initialTotal: 5,
          key: "a",
        },
      },
    );

    expect(result.current.contents).toHaveLength(1);

    rerender({
      initialContents: [makeContent("9")],
      initialTotal: 1,
      key: "b",
    });

    expect(result.current.contents.map((c) => c.id)).toEqual(["9"]);
    expect(result.current.hasMore).toBe(false);
  });
});
