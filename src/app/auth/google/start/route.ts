import { type NextRequest, NextResponse } from "next/server";
import {
  OAUTH_NEXT_COOKIE,
  oauthRoundTripCookieOptions,
} from "@/lib/authCookies";
import { isSafeNextPath, oauthAuthorizationUrl } from "@/lib/authRedirect";

// 인가 코드 처리는 전부 백엔드 oauth2Login이 맡는다. 프론트는 로그인 후
// 돌아갈 next만 쿠키에 남기고 백엔드 진입점으로 넘긴다.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawNext = searchParams.get("next");
  const next = isSafeNextPath(rawNext) ? rawNext : "/";

  const response = NextResponse.redirect(oauthAuthorizationUrl("google"));
  response.cookies.set(OAUTH_NEXT_COOKIE, next, oauthRoundTripCookieOptions());

  return response;
}
