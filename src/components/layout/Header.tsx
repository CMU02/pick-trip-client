"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useAuth } from "@/hooks/useAuth";
import { useBasket } from "@/hooks/useBasket";
import { cn } from "@/lib/utils";
import { ALL_REGIONS_QUERY } from "@/types/region";

const NAV_ITEMS = [
  { href: "/", matchPath: "/", label: "홈" },
  {
    href: "/explore",
    matchPath: "/explore",
    label: "콘텐츠 탐색",
  },
  {
    href: `/select/conditions?regions=${ALL_REGIONS_QUERY}`,
    matchPath: "/select/conditions",
    label: "AI일정",
  },
] as const;

const DASHBOARD_NAV_ITEMS = [
  { href: "/dashboard", matchPath: "/dashboard", label: "대시보드" },
] as const;

function isNavActive(pathname: string, matchPath: string) {
  if (matchPath === "/") return pathname === "/";
  return pathname === matchPath || pathname.startsWith(`${matchPath}/`);
}

export function Header() {
  const { status, user, logout } = useAuth();
  const pathname = usePathname();
  const { items: basketItems } = useBasket();
  const navItems = status === "authenticated" ? DASHBOARD_NAV_ITEMS : NAV_ITEMS;

  // 일정 공유 페이지는 헤더 없는 공개 페이지다.
  if (pathname.startsWith("/share/")) return null;

  return (
    <header className="sticky top-0 z-40 h-[66px] border-b border-border bg-white/[.93] backdrop-blur-[14px]">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/pick-trip-icon.svg" alt="" width={24} height={24} />
            <span className="text-[20px] font-extrabold tracking-[-0.035em] text-foreground">
              Pick<span className="text-primary">Trip</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1 text-sm font-medium">
            {navItems.map((item) => {
              const active = isNavActive(pathname, item.matchPath);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-full px-[13px] py-2 transition-colors",
                    active
                      ? "bg-accent font-bold text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/contents"
            className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-accent-foreground transition-colors hover:bg-accent/80"
          >
            <Icon name="bookmark" size={14} />
            바구니 {basketItems.length}
          </Link>

          {status === "authenticated" && user && (
            <div className="flex items-center gap-3">
              <Link
                href="/favorites"
                aria-label="찜한 콘텐츠"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Icon name="heart" size={20} />
              </Link>
              <div className="flex items-center gap-2 rounded-full border border-border py-1 pr-3 pl-1 transition-colors hover:border-[oklch(0.82_0.06_30)]">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[oklch(0.63_0.2_30)] to-[oklch(0.53_0.2_16)] text-xs font-semibold text-white">
                  {user.nickname[0]}
                </span>
                <span className="text-sm text-foreground">{user.nickname}</span>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/mypage">마이페이지</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={() => logout()}>
                로그아웃
              </Button>
            </div>
          )}

          {status === "unauthenticated" && (
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/login?next=/mypage">마이페이지</Link>
              </Button>
              <Button asChild size="sm">
                <Link href={`/login?next=${encodeURIComponent(pathname)}`}>
                  로그인
                </Link>
              </Button>
            </div>
          )}

          {status === "loading" && (
            <div className="h-8 w-20" aria-hidden="true" />
          )}
        </div>
      </div>
    </header>
  );
}
