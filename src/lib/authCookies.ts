const isProduction = process.env.NODE_ENV === "production";

export const AUTH_COOKIE_PATH = "/auth";
export const REFRESH_TOKEN_COOKIE = "pt_refresh_token";
export const OAUTH_NEXT_COOKIE = "pt_oauth_next";

// OAuth 왕복(백엔드 → 소셜 인가 화면 → 백엔드 콜백 → /auth/callback) 동안만
// 유효하면 되는 짧은 TTL. state 검증은 백엔드가 자체 쿠키로 처리하므로
// 프론트는 로그인 후 돌아갈 next 경로만 들고 있는다.
export function oauthRoundTripCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: AUTH_COOKIE_PATH,
    maxAge: 300,
  };
}

// 백엔드 jwt.refresh-token-expiration과 맞춘 14일.
export function refreshTokenCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: AUTH_COOKIE_PATH,
    maxAge: 60 * 60 * 24 * 14,
  };
}
