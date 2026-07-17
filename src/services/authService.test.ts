import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  LoginResponse,
  TokenRefreshResponse,
  UserMeResponse,
} from "@/types/auth";
import * as apiClientModule from "./apiClient";
import {
  getCurrentUser,
  loginWithKakao,
  logoutUser,
  refreshAccessToken,
} from "./authService";

vi.mock("./apiClient", async (importOriginal) => {
  const actual = await importOriginal<typeof apiClientModule>();
  return { ...actual, apiFetch: vi.fn() };
});
// axios를 완전 automock하면 apiClient.ts가 모듈 로드 시 호출하는
// axios.create()가 undefined를 반환해 apiClient.interceptors 접근이 깨진다.
// create()만 interceptors가 있는 최소 인스턴스를 반환하도록 덮어써
// 기존 axios.post 자동 목 동작은 그대로 유지한다.
vi.mock("axios", async (importOriginal) => {
  const actual = await importOriginal<typeof import("axios")>();
  return {
    ...actual,
    default: {
      ...actual.default,
      post: vi.fn(),
      create: () => ({
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
      }),
    },
  };
});

describe("loginWithKakao", () => {
  const mockAxiosPost = vi.mocked(axios.post);

  const mockResponse: LoginResponse = {
    accessToken: "access-1",
    refreshToken: "refresh-1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("POST /api/v1/auth/login/kakao를 올바른 body로 호출하고 응답을 그대로 반환", async () => {
    mockAxiosPost.mockResolvedValueOnce({ data: mockResponse });

    const result = await loginWithKakao({ authorizationCode: "code-1" });

    expect(mockAxiosPost).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/auth/login/kakao"),
      { authorizationCode: "code-1" },
    );
    expect(result).toEqual(mockResponse);
  });
});

describe("refreshAccessToken", () => {
  const mockApiFetch = vi.mocked(apiClientModule.apiFetch);

  const mockResponse: TokenRefreshResponse = {
    accessToken: "access-2",
    refreshToken: "refresh-2",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("POST /api/v1/auth/token/refresh를 올바른 body로 호출하고 응답을 그대로 반환", async () => {
    mockApiFetch.mockResolvedValueOnce(mockResponse);

    const result = await refreshAccessToken({ refreshToken: "refresh-1" });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/v1/auth/token/refresh",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ refreshToken: "refresh-1" }),
      }),
    );
    expect(result).toEqual(mockResponse);
  });
});

describe("logoutUser", () => {
  const mockApiFetch = vi.mocked(apiClientModule.apiFetch);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accessToken이 있으면 Authorization 헤더를 붙여 DELETE /api/v1/auth/logout을 호출", async () => {
    mockApiFetch.mockResolvedValueOnce(undefined);

    await logoutUser("access-1");

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/v1/auth/logout",
      expect.objectContaining({
        method: "DELETE",
        headers: { Authorization: "Bearer access-1" },
      }),
    );
  });

  it("accessToken이 없어도 호출은 진행된다(헤더 없이)", async () => {
    mockApiFetch.mockResolvedValueOnce(undefined);

    await logoutUser();

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/v1/auth/logout",
      expect.objectContaining({ method: "DELETE" }),
    );
    const [, options] = mockApiFetch.mock.calls[0];
    expect(options?.headers).toBeUndefined();
  });
});

describe("getCurrentUser", () => {
  const mockApiFetch = vi.mocked(apiClientModule.apiFetch);

  const mockResponse: UserMeResponse = {
    uid: "uid-1",
    email: "user@example.com",
    nickname: "김여행",
    profileImageUrl: "https://example.com/profile.png",
    provider: "KAKAO",
    createdAt: "2026-01-01T00:00:00Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Authorization 헤더를 붙여 GET /api/v1/users/me를 호출하고 응답을 그대로 반환", async () => {
    mockApiFetch.mockResolvedValueOnce(mockResponse);

    const result = await getCurrentUser("access-1");

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/v1/users/me",
      expect.objectContaining({
        headers: { Authorization: "Bearer access-1" },
      }),
    );
    expect(result).toEqual(mockResponse);
  });
});
