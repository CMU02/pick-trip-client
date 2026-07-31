"use client";

import Image from "next/image";
import Link from "next/link";

import { useRecentViews } from "@/hooks/useRecentViews";

export function RecentSection() {
  const { items } = useRecentViews();

  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-bold text-foreground">
        RECENT · 최근 본 콘텐츠
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {items.map(({ content }) => (
          <Link
            key={content.id}
            href={`/contents/${content.id}`}
            className="flex w-48 shrink-0 items-center gap-3 rounded-lg border border-border bg-card p-2"
          >
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
              {content.imageUrl ? (
                <Image
                  src={content.imageUrl}
                  alt={content.name}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                  없음
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{content.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {content.address}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
