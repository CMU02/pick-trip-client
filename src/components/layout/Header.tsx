"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
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

function isNavActive(pathname: string, matchPath: string) {
  if (matchPath === "/") return pathname === "/";
  return pathname === matchPath || pathname.startsWith(`${matchPath}/`);
}

export function Header() {
  const { status, user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-base font-semibold text-foreground">
            PickTrip
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium sm:gap-5">
            {NAV_ITEMS.map((item) => {
              const active = isNavActive(pathname, item.matchPath);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "transition-colors hover:text-foreground",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {status === "authenticated" && user && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-700">
                {user.nickname[0]}
              </span>
              <span className="text-sm text-foreground">{user.nickname}</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => logout()}>
              로그아웃
            </Button>
          </div>
        )}

        {status === "unauthenticated" && (
          <Button asChild size="sm">
            <Link href={`/login?next=${encodeURIComponent(pathname)}`}>
              로그인
            </Link>
          </Button>
        )}

        {status === "loading" && (
          <div className="h-8 w-20" aria-hidden="true" />
        )}
      </div>
    </header>
  );
}
