"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/hooks/useAuth";

const PROVIDER_LABELS: Record<string, string> = {
  KAKAO: "카카오",
  GOOGLE: "구글",
};

function formatJoinedDate(iso: string) {
  return `${new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(iso))} 가입`;
}

// 비로그인 직접 접근 가드. DashboardClient 등 다른 보호 라우트와 동일한 패턴이다.
export function MyPageClient() {
  const { status, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  if (status === "unauthenticated" || status === "loading" || !user) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-bold text-foreground">마이페이지</h1>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-100 text-xl font-semibold text-teal-700">
            {user.nickname[0]}
          </span>
          <div>
            <p className="text-base font-semibold text-foreground">
              {user.nickname}
            </p>
            <p className="text-sm text-muted-foreground">
              <span>{PROVIDER_LABELS[user.provider] ?? user.provider}</span>
              {" · "}
              <span>{formatJoinedDate(user.createdAt)}</span>
            </p>
          </div>
        </div>

        {user.email && (
          <dl className="mt-4 border-t border-border pt-4 text-sm">
            <div className="flex items-center gap-2">
              <dt className="text-muted-foreground">이메일</dt>
              <dd className="text-foreground">{user.email}</dd>
            </div>
          </dl>
        )}
      </div>

      <Link
        href="/itineraries"
        className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted/50"
      >
        <span className="font-medium text-foreground">내 여행</span>
        <span className="text-sm text-muted-foreground">
          저장한 일정 보기 →
        </span>
      </Link>
    </div>
  );
}
