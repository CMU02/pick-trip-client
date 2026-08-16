"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/hooks/useAuth";

interface HomeGateProps {
  children: React.ReactNode;
}

// 로그인 상태면 마케팅 홈 대신 /dashboard로 보낸다. loading 상태에도 마케팅
// 화면이 잠깐 보였다 사라지는 깜빡임을 막기 위해 렌더하지 않는다.
export function HomeGate({ children }: HomeGateProps) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  if (status === "authenticated" || status === "loading") return null;

  return <>{children}</>;
}
