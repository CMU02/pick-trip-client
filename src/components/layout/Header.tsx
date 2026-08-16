"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
            aria-label={`바구니 ${basketItems.length}개`}
            className="relative flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-[oklch(0.82_0.06_30)] hover:text-foreground"
          >
            <Icon name="bookmark" size={14} />
            {basketItems.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {basketItems.length}
              </span>
            )}
          </Link>

          {status === "authenticated" && user && (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border border-border py-1 pr-3 pl-1 text-sm text-foreground outline-none transition-colors hover:border-[oklch(0.82_0.06_30)]">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[oklch(0.63_0.2_30)] to-[oklch(0.53_0.2_16)] text-xs font-semibold text-white">
                  {user.nickname[0]}
                </span>
                <span>{user.nickname}</span>
                <Icon
                  name="chevron-down"
                  size={16}
                  className="text-muted-foreground"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/mypage">
                    <Icon name="user" size={16} />
                    마이페이지
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/favorites">
                    <Icon name="heart" size={16} />
                    찜한 콘텐츠
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => logout()}
                >
                  <Icon name="logout" size={16} />
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
