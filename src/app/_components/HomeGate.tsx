"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/hooks/useAuth";

interface HomeGateProps {
  children: React.ReactNode;
}

// 로그인 상태면 마케팅 홈 대신 /dashboard로 보낸다.
// refreshToken 쿠키는 path=/auth로 묶여 있어 홈 요청에는 실리지 않으므로 서버는
// 세션을 알 수 없다(SSR 시점 status는 항상 "loading"). 그래서 loading에서는
// 비로그인 기준으로 children을 그대로 렌더한다. 이렇게 해야 JS를 실행하지 않는
// 크롤러에게도 홈 본문이 서버 응답 HTML에 담긴다.
// 로그인 사용자는 세션 확인이 끝나는 즉시 children을 감추고 리다이렉트한다.
export function HomeGate({ children }: HomeGateProps) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  if (status === "authenticated") return null;

  return <>{children}</>;
}
