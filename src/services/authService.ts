import { apiClient } from "@/services/apiClient";
import type {
  GoogleLoginRequest,
  KakaoLoginRequest,
  LoginResponse,
  TokenRefreshRequest,
  TokenRefreshResponse,
  UserMeResponse,
} from "@/types/auth";

function authHeaders(accessToken?: string) {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
}

export async function loginWithKakao(
  request: KakaoLoginRequest,
): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>(
    "/api/v1/auth/login/kakao",
    request,
  );
  return data;
}

// 백엔드에 /api/v1/auth/login/google이 아직 없어(이슈 #40) 인터페이스만 우선 정의.
// 백엔드 준비 후 실제 응답 스키마가 LoginResponse와 다르면 이 함수만 조정한다.
export async function loginWithGoogle(
  request: GoogleLoginRequest,
): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>(
    "/api/v1/auth/login/google",
    request,
  );
  return data;
}

export async function refreshAccessToken(
  request: TokenRefreshRequest,
): Promise<TokenRefreshResponse> {
  const { data } = await apiClient.post<TokenRefreshResponse>(
    "/api/v1/auth/token/refresh",
    request,
  );
  return data;
}

export async function logoutUser(accessToken?: string): Promise<void> {
  await apiClient.delete<void>("/api/v1/auth/logout", {
    headers: authHeaders(accessToken),
  });
}

export async function getCurrentUser(
  accessToken: string,
): Promise<UserMeResponse> {
  const { data } = await apiClient.get<UserMeResponse>("/api/v1/users/me", {
    headers: authHeaders(accessToken),
  });
  return data;
}
