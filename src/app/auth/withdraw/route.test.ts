import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/authService", () => ({
  refreshAccessToken: vi.fn(),
  withdrawUser: vi.fn(),
}));

import { ApiError } from "@/lib/errors";
import { refreshAccessToken, withdrawUser } from "@/services/authService";
import { POST } from "./route";

const mockRefresh = vi.mocked(refreshAccessToken);
const mockWithdraw = vi.mocked(withdrawUser);

function post(cookie?: string): NextRequest {
  return new NextRequest("http://localhost/auth/withdraw", {
    method: "POST",
    headers: cookie ? { cookie } : undefined,
  });
}

const REFRESH_COOKIE = "pt_refresh_token=refresh-1";

describe("POST /auth/withdraw", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("리프레시 쿠키가 없으면 백엔드 호출 없이 ok:true로 세션을 정리한다", async () => {
    const res = await post();

    const result = await POST(res);

    expect(result.status).toBe(200);
    await expect(result.json()).resolves.toEqual({ ok: true });
    expect(result.headers.get("set-cookie")).toContain("pt_refresh_token=");
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(mockWithdraw).not.toHaveBeenCalled();
  });

  it("정상 흐름: 새 액세스 토큰으로 탈퇴를 호출하고 리프레시 쿠키를 만료시킨다", async () => {
    mockRefresh.mockResolvedValueOnce({
      accessToken: "access-2",
      refreshToken: "refresh-2",
    });
    mockWithdraw.mockResolvedValueOnce(undefined);

    const result = await POST(post(REFRESH_COOKIE));

    expect(mockRefresh).toHaveBeenCalledWith({ refreshToken: "refresh-1" });
    expect(mockWithdraw).toHaveBeenCalledWith("access-2");
    expect(result.status).toBe(200);
    await expect(result.json()).resolves.toEqual({ ok: true });
    const setCookie = result.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("pt_refresh_token=");
    expect(setCookie).toMatch(/Max-Age=0|Expires=Thu, 01 Jan 1970/i);
  });

  it("이미 하드 삭제된 계정(404)은 탈퇴 완료로 처리한다", async () => {
    mockRefresh.mockResolvedValueOnce({
      accessToken: "access-2",
      refreshToken: "refresh-2",
    });
    mockWithdraw.mockRejectedValueOnce(
      new ApiError(404, "사용자를 찾을 수 없습니다", "USER_NOT_FOUND"),
    );

    const result = await POST(post(REFRESH_COOKIE));

    expect(result.status).toBe(200);
    await expect(result.json()).resolves.toEqual({ ok: true });
    expect(result.headers.get("set-cookie")).toContain("pt_refresh_token=");
  });

  it("그 외 백엔드 오류(500)면 세션을 유지하고 ok:false를 반환한다", async () => {
    mockRefresh.mockResolvedValueOnce({
      accessToken: "access-2",
      refreshToken: "refresh-2",
    });
    mockWithdraw.mockRejectedValueOnce(
      new ApiError(500, "서버 오류", "INTERNAL_ERROR"),
    );

    const result = await POST(post(REFRESH_COOKIE));

    expect(result.status).toBe(200);
    await expect(result.json()).resolves.toEqual({ ok: false });
    expect(result.headers.get("set-cookie")).toBeNull();
  });

  it("리프레시가 실패하면 탈퇴를 호출하지 않고 로컬 세션만 정리한다", async () => {
    mockRefresh.mockRejectedValueOnce(
      new ApiError(401, "인증이 필요합니다", "AUTH_REQUIRED"),
    );

    const result = await POST(post(REFRESH_COOKIE));

    expect(mockWithdraw).not.toHaveBeenCalled();
    expect(result.status).toBe(200);
    await expect(result.json()).resolves.toEqual({ ok: true });
    expect(result.headers.get("set-cookie")).toContain("pt_refresh_token=");
  });
});
