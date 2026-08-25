import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { REGION_LABELS, REGIONS } from "@/types/region";

const SITE_NAV = [
  { href: "/", label: "홈" },
  { href: "/explore", label: "콘텐츠 탐색" },
  { href: "/select/conditions", label: "AI일정" },
] as const;

const LEGAL_NAV = [
  { href: "/terms", label: "이용약관", strong: false },
  // 개인정보처리방침은 고지 의무가 있는 문서라 나머지 링크보다 눈에 띄게 둔다.
  { href: "/privacy", label: "개인정보처리방침", strong: true },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-border bg-[oklch(0.985_0.008_30)]">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:grid-cols-[1.2fr_1fr_1fr]">
        <div className="flex items-start gap-2">
          <Image src="/pick-trip-icon.svg" alt="" width={24} height={24} />
          <div>
            <p className="text-[15px] font-extrabold tracking-[-0.02em] text-foreground">
              Pick<span className="text-primary">Trip</span>
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
              하동·영주·예천의 여행 콘텐츠와
              <br />
              AI 맞춤 일정을 제공해요.
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
            메뉴
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {SITE_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="tap-target text-[13.5px] text-foreground transition-colors hover:text-primary"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
            지역
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {REGIONS.map((region) => (
              <li key={region}>
                <Link
                  href={`/select/conditions?regions=${region}`}
                  className="tap-target text-[13.5px] text-foreground transition-colors hover:text-primary"
                >
                  {REGION_LABELS[region]}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border px-4 py-4">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © 2026 PickTrip. All rights reserved.
          </p>
          <nav aria-label="약관 및 정책">
            <ul className="flex items-center gap-4">
              {LEGAL_NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "tap-target text-xs transition-colors hover:text-primary",
                      item.strong
                        ? "font-bold text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
