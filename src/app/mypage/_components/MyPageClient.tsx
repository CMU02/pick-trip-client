"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { ContentImage } from "@/components/ContentImage";
import { Icon } from "@/components/ui/icon";
import { useAuth } from "@/hooks/useAuth";
import { useBasket } from "@/hooks/useBasket";
import { useFavorites } from "@/hooks/useFavorites";
import { useSavedItineraries } from "@/hooks/useSavedItineraries";
import { WithdrawSection } from "./WithdrawSection";

const PROVIDER_LABELS: Record<string, string> = {
  KAKAO: "카카오",
  GOOGLE: "구글",
};

const FAVORITES_PREVIEW_COUNT = 4;

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
  const { items: savedItems } = useSavedItineraries();
  const { items: favoriteItems } = useFavorites();
  const { items: basketItems } = useBasket();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  if (status === "unauthenticated" || status === "loading" || !user) {
    return null;
  }

  const links = [
    {
      label: "내 여행",
      value: `${savedItems.length}개`,
      hint: "저장한 일정 보기",
      href: "/itineraries",
    },
    {
      label: "찜한 콘텐츠",
      value: `${favoriteItems.length}개`,
      hint: "찜한 장소 모아보기",
      href: "/favorites",
    },
    {
      label: "여행 바구니",
      value: `${basketItems.length}개`,
      hint: "담은 콘텐츠 확인",
      href: "/basket",
    },
  ];

  // favoriteStore.add가 배열 뒤에 append하므로 최신 찜이 마지막에 온다.
  // /favorites 페이지와 동일하게 최근 찜한 순으로 보여준다.
  const favoritesPreview = [...favoriteItems]
    .reverse()
    .slice(0, FAVORITES_PREVIEW_COUNT);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-[28px] font-extrabold tracking-tight text-foreground">
        마이페이지
      </h1>

      <div className="overflow-hidden rounded-[22px] border border-border">
        <div className="flex items-center gap-4.5 bg-gradient-to-br from-[oklch(0.63_0.2_30)] to-[oklch(0.53_0.2_16)] px-7.5 py-7 text-white">
          <span className="flex h-[62px] w-[62px] items-center justify-center rounded-full bg-white/20 text-2xl font-extrabold">
            {user.nickname[0]}
          </span>
          <div>
            <p className="text-[22px] font-bold tracking-tight">
              {user.nickname}
            </p>
            <p className="mt-1.5 text-[13px] text-white/85">
              {PROVIDER_LABELS[user.provider] ?? user.provider} ·{" "}
              {formatJoinedDate(user.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-10 bg-card px-7.5 py-5">
          {user.email && (
            <div>
              <p className="text-xs text-muted-foreground">이메일</p>
              <p className="mt-1 text-[13.5px] font-semibold">{user.email}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">연동 계정</p>
            <p className="mt-1 text-[13.5px] font-semibold">
              {PROVIDER_LABELS[user.provider] ?? user.provider}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {links.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="rounded-[18px] border border-border bg-card p-5.5 transition-colors hover:border-primary/40 hover:bg-[oklch(0.99_0.012_30)]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[14.5px] font-bold text-foreground">
                {link.label}
              </span>
              <span className="text-primary">→</span>
            </div>
            <p className="mt-2 text-2xl font-extrabold tracking-tight text-[oklch(0.58_0.19_28)]">
              {link.value}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{link.hint}</p>
          </Link>
        ))}
      </div>

      <section className="mt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="h-[18px] w-1 rounded-full bg-primary" />
            <h2 className="text-[19px] font-bold tracking-tight">
              찜한 콘텐츠
            </h2>
          </div>
          {favoriteItems.length > FAVORITES_PREVIEW_COUNT && (
            <Link
              href="/favorites"
              className="text-[13px] font-bold text-primary hover:underline"
            >
              더보기 →
            </Link>
          )}
        </div>

        {favoriteItems.length === 0 ? (
          <div className="mt-4 flex flex-col items-center gap-2.5 rounded-[20px] border-[1.5px] border-dashed border-[oklch(0.9_0.03_30)] py-11 text-center">
            <Icon
              name="heart"
              size={26}
              className="text-[oklch(0.75_0.06_30)]"
            />
            <p className="text-[13.5px] text-muted-foreground">
              아직 찜한 콘텐츠가 없습니다
            </p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {favoritesPreview.map((content) => (
              <Link
                key={content.id}
                href={`/contents/${content.id}?from=favorites`}
                className="overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/40"
              >
                <div className="relative h-[110px] bg-muted">
                  <ContentImage
                    src={content.imageUrl}
                    alt={content.name}
                    category={content.category}
                    size="md"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                </div>
                <div className="p-3.5">
                  <p className="truncate text-[13.5px] font-bold">
                    {content.name}
                  </p>
                  <p className="mt-1 truncate text-[11.5px] text-muted-foreground">
                    {content.address}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <WithdrawSection />
    </div>
  );
}
