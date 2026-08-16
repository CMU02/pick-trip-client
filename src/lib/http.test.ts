import { describe, expect, it } from "vitest";

import { authHeaders } from "./http";

describe("authHeaders", () => {
  it("accessToken이 있으면 Authorization 헤더를 반환한다", () => {
    expect(authHeaders("token-1")).toEqual({
      Authorization: "Bearer token-1",
    });
  });

  it("accessToken이 없으면 undefined를 반환한다", () => {
    expect(authHeaders()).toBeUndefined();
  });
});
