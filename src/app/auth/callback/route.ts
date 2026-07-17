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
//
// 보안 주의: 이 콜백은 URL로 받은 refreshToken을 그대로 저장하므로, 공격자가
// 자기 토큰을 넣은 링크를 피해자에게 클릭시키면 피해자를 공격자 계정으로
// 로그인시키는 login CSRF/세션 고정이 가능하다. 완전한 방어는 백엔드가
// 프론트 state를 echo해 대조하고 토큰을 URL 밖(POST/쿠키)으로 옮기는
// 계약 변경이 필요하다. 여기서는 프론트 단독으로 가능한 방어로,
// /auth/{provider}/start가 심는 pt_oauth_next 표식이 있는 요청(=이 브라우저가
// 로그인을 시작한 경우)만 받아들여 맨링크 콜백을 거부한다.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const refreshToken = searchParams.get("refreshToken");

  const rawNext = request.cookies.get(OAUTH_NEXT_COOKIE)?.value;
  const flowInitiated = rawNext !== undefined;
  const next = isSafeNextPath(rawNext) ? rawNext : "/";

  function clearNextCookie(response: NextResponse) {
    response.cookies.delete({
      name: OAUTH_NEXT_COOKIE,
      path: AUTH_COOKIE_PATH,
    });
    return response;
  }

  if (!refreshToken || !flowInitiated) {
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
