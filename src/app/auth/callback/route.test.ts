import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/authService", () => ({
  exchangeOAuthCode: vi.fn(),
}));

import { exchangeOAuthCode } from "@/services/authService";
import { GET } from "./route";

const mockExchange = vi.mocked(exchangeOAuthCode);

function get(url: string, cookie?: string): NextRequest {
  return new NextRequest(url, {
    headers: cookie ? { cookie } : undefined,
  });
}

describe("GET /auth/callback", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("교환에 성공하면 로그인 표식 쿠키를 JS가 읽을 수 있게 심는다", async () => {
    mockExchange.mockResolvedValue({
      accessToken: "access-1",
      refreshToken: "refresh-1",
    } as Awaited<ReturnType<typeof exchangeOAuthCode>>);

    const res = await GET(
      get(
        "http://localhost/auth/callback?code=abc",
        "pt_oauth_nonce=n1; pt_oauth_next=/itinerary",
      ),
    );

    const cookies = res.headers.getSetCookie();
    const marker = cookies.find((c) => c.startsWith("pt_just_logged_in="));
    expect(marker).toBeDefined();
    expect(marker?.toLowerCase()).not.toContain("httponly");
  });

  it("교환에 실패하면 표식 쿠키를 심지 않는다", async () => {
    mockExchange.mockRejectedValue(new Error("401"));

    const res = await GET(
      get("http://localhost/auth/callback?code=abc", "pt_oauth_nonce=n1"),
    );

    expect(res.headers.get("location")).toContain("/login?error=1");
    expect(
      res.headers
        .getSetCookie()
        .some((c) => c.startsWith("pt_just_logged_in=")),
    ).toBe(false);
  });
});
