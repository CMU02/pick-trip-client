"use client";

import Image from "next/image";
import Link from "next/link";

import { useRecentViews } from "@/hooks/useRecentViews";

const MAX_ITEMS = 4;

export function RecentSection() {
  const { items } = useRecentViews();
  const recent = items.slice(0, MAX_ITEMS);

  return (
    // 제목 행을 카드 밖으로 빼서(MyTripsSection과 같은 구조) "내 여행"
    // 헤딩과 같은 y좌표에서 시작하게 한다 — 전에는 이 section 전체가
    // p-5 카드였어서, 카드 테두리가 "내 여행" 제목보다 위로 튀어나와
    // 보였다.
    <section className="flex h-full flex-col gap-3.5">
      <div className="flex items-center gap-2.5">
        <span className="h-[19px] w-1 rounded-full bg-primary" />
        <h2 className="text-[17px] font-bold tracking-tight text-foreground">
          최근에 본
        </h2>
      </div>
      {/* flex-1: 옆 "내 여행" 박스가 더 길 때(grid items-stretch로 이
          section 자체가 그 높이만큼 늘어난 상태) 카드가 그 늘어난
          공간을 실제로 채우게 한다. */}
      <div className="flex-1 rounded-[20px] border border-border bg-[oklch(0.99_0.006_30)] p-5">
        {/* 아이템이 없어도 카드 높이(h-16)만큼 min-h를 미리 확보해, 나중에
            최근 본 콘텐츠가 채워질 때 페이지 높이가 갑자기 늘어나지 않게 한다. */}
        <div
          data-testid="recent-section-row"
          className="flex min-h-16 flex-col gap-2"
        >
          {recent.map(({ content }) => (
            <Link
              key={content.id}
              href={`/contents/${content.id}`}
              className="flex items-center gap-2.5 rounded-[14px] border border-[oklch(0.94_0.01_30)] bg-white p-2.5 transition-colors hover:border-[oklch(0.8_0.09_30)]"
            >
              <div className="relative h-[42px] w-[42px] shrink-0 overflow-hidden rounded-[11px] bg-muted">
                {content.imageUrl ? (
                  <Image
                    src={content.imageUrl}
                    alt={content.name}
                    fill
                    className="object-cover"
                    sizes="42px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                    없음
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold">{content.name}</p>
                <p className="truncate text-[11.5px] text-muted-foreground">
                  {content.address}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
