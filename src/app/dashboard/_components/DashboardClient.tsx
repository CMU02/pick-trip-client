"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/hooks/useAuth";

import { DashboardHero } from "./DashboardHero";

// 비로그인 직접 접근 가드. HomeGate와 대칭되는 반대 방향 리다이렉트다.
export function DashboardClient() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  if (status === "unauthenticated" || status === "loading") return null;

  return (
    <div className="flex flex-col gap-10">
      <DashboardHero />
    </div>
  );
}
