"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { BasketLayout } from "@/components/BasketLayout";
import { RecommendedCard } from "@/components/RecommendedCard";
import { Icon } from "@/components/ui/icon";
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
        <div>
          <p className="text-xs font-semibold tracking-wide text-primary uppercase">
            Favorites
          </p>
          <h1 className="text-lg font-bold text-foreground">찜한 콘텐츠</h1>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
            <Icon name="heart" size={32} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              아직 찜한 콘텐츠가 없습니다
            </p>
            <Link
              href="/dashboard/for-you"
              className="text-sm text-primary hover:underline"
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
