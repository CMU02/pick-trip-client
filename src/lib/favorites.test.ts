import { describe, expect, it } from "vitest";
import type { Content } from "@/types/content";
import { sortByRecentlyFavorited } from "./favorites";

const content = (overrides: Partial<Content>): Content => ({
  id: "id",
  name: "name",
  region: "HADONG",
  imageUrl: null,
  address: "",
  ...overrides,
});

describe("sortByRecentlyFavorited", () => {
  it("createdAt이 최신인 항목을 앞으로 정렬한다(응답 배열 순서와 무관)", () => {
    const older = content({ id: "1", createdAt: "2026-01-01T00:00:00Z" });
    const newer = content({ id: "2", createdAt: "2026-02-01T00:00:00Z" });

    // 배열 순서는 오래된 게 먼저지만, 결과는 최신순이어야 한다.
    expect(sortByRecentlyFavorited([older, newer])).toEqual([newer, older]);
    // 배열 순서를 반대로 줘도(서버가 다른 순서로 내려줘도) 결과는 같다.
    expect(sortByRecentlyFavorited([newer, older])).toEqual([newer, older]);
  });

  it("createdAt이 없는 항목(낙관적으로 막 추가된 항목)은 맨 앞에 온다", () => {
    const existing = content({ id: "1", createdAt: "2026-01-01T00:00:00Z" });
    const justAdded = content({ id: "2", createdAt: undefined });

    expect(sortByRecentlyFavorited([existing, justAdded])).toEqual([
      justAdded,
      existing,
    ]);
  });

  it("원본 배열을 변경하지 않는다", () => {
    const items = [
      content({ id: "1", createdAt: "2026-01-01T00:00:00Z" }),
      content({ id: "2", createdAt: "2026-02-01T00:00:00Z" }),
    ];
    const original = [...items];

    sortByRecentlyFavorited(items);

    expect(items).toEqual(original);
  });
});
