"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { BasketLayout } from "@/components/BasketLayout";
import { RecommendedCard } from "@/components/RecommendedCard";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { ALL_REGIONS_QUERY } from "@/types/region";

// 비로그인 직접 접근 가드. DashboardClient/ForYouClient와 동일한 리다이렉트 패턴이다.
export function FavoritesClient() {
  const { status } = useAuth();
  const router = useRouter();
  const { items } = useFavorites();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  if (status === "unauthenticated" || status === "loading") return null;

  return (
    <BasketLayout
      generateHref={`/select/conditions?regions=${ALL_REGIONS_QUERY}`}
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2.5">
          <span className="h-[22px] w-1 rounded-full bg-primary" />
          <h1 className="text-[28px] font-extrabold tracking-tight text-foreground">
            찜한 콘텐츠
          </h1>
          <span className="rounded-full bg-accent px-3 py-1 text-[12.5px] font-bold text-accent-foreground">
            {items.length}개
          </span>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-[22px] border-[1.5px] border-dashed border-[oklch(0.88_0.055_30)] bg-[oklch(0.99_0.012_30)] py-[70px] text-center">
            <span className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-accent text-[22px] text-primary">
              ♡
            </span>
            <p className="text-[15px] font-bold text-foreground/80">
              아직 찜한 콘텐츠가 없습니다
            </p>
            <Link
              href="/explore"
              className="mt-1 rounded-xl bg-primary px-5.5 py-3 text-[13.5px] font-bold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              추천 콘텐츠 보러 가기 →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[...items].reverse().map((content) => (
              <RecommendedCard
                key={content.id}
                content={content}
                detailHref={`/contents/${content.id}?from=favorites`}
              />
            ))}
          </div>
        )}
      </div>
    </BasketLayout>
  );
}
