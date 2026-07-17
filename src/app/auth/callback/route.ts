import { type NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_PATH,
  OAUTH_NEXT_COOKIE,
  REFRESH_TOKEN_COOKIE,
  refreshTokenCookieOptions,
} from "@/lib/authCookies";
import { isSafeNextPath } from "@/lib/authRedirect";

// 백엔드 OAuth2AuthenticationSuccessHandler가 카카오/구글 공통으로
// `{OAUTH2_REDIRECT_URI}?accessToken=...&refreshToken=...` 형태로 보내는 지점.
// 토큰이 URL에 노출된 상태이므로 서버에서 즉시 거둬 httpOnly 쿠키로 옮기고,
// 토큰이 빠진 next 경로로 redirect해 브라우저 히스토리에 남지 않게 한다.
// accessToken은 버린다. 이후 /auth/session이 refreshToken으로 새로 발급받는다.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const refreshToken = searchParams.get("refreshToken");

  const rawNext = request.cookies.get(OAUTH_NEXT_COOKIE)?.value;
  const next = isSafeNextPath(rawNext) ? rawNext : "/";

  function clearNextCookie(response: NextResponse) {
    response.cookies.delete({
      name: OAUTH_NEXT_COOKIE,
      path: AUTH_COOKIE_PATH,
    });
    return response;
  }

  if (!refreshToken) {
    const url = new URL("/login", origin);
    url.searchParams.set("error", "1");
    url.searchParams.set("next", next);
    return clearNextCookie(NextResponse.redirect(url));
  }

  const response = clearNextCookie(
    NextResponse.redirect(new URL(next, origin)),
  );
  response.cookies.set(
    REFRESH_TOKEN_COOKIE,
    refreshToken,
    refreshTokenCookieOptions(),
  );

  return response;
}
