import { type NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_PATH, REFRESH_TOKEN_COOKIE } from "@/lib/authCookies";
import { ApiError } from "@/lib/errors";
import { refreshAccessToken, withdrawUser } from "@/services/authService";

// 탈퇴가 끝났거나 세션이 이미 죽은 경우: 리프레시 쿠키를 지우고 ok:true.
// 클라이언트는 이 응답을 받으면 세션 캐시를 비우고 홈으로 보낸다.
function clearedResponse() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete({
    name: REFRESH_TOKEN_COOKIE,
    path: AUTH_COOKIE_PATH,
  });
  return response;
}

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) {
    return clearedResponse();
  }

  // 클라이언트 캐시의 액세스 토큰은 최대 1시간 stale일 수 있으므로,
  // 리프레시 쿠키로 새 액세스 토큰을 받아 탈퇴를 호출한다.
  let accessToken: string;
  try {
    const tokens = await refreshAccessToken({ refreshToken });
    accessToken = tokens.accessToken;
  } catch {
    // 리프레시 실패 = 세션이 이미 죽음. 로컬 쿠키만 정리한다.
    return clearedResponse();
  }

  try {
    await withdrawUser(accessToken);
  } catch (error) {
    // 이미 하드 삭제된 계정(404)은 탈퇴 완료와 동일하게 처리한다.
    if (error instanceof ApiError && error.status === 404) {
      return clearedResponse();
    }
    // 그 외 오류는 아직 회원이므로 세션(쿠키)을 유지하고 실패를 알린다.
    return NextResponse.json({ ok: false });
  }

  return clearedResponse();
}
