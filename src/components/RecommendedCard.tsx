"use client";

import Image from "next/image";
import Link from "next/link";

import { ContentCardActions } from "@/components/ContentCardActions";
import { CATEGORY_LABELS, type Content } from "@/types/content";

interface RecommendedCardProps {
  content: Content;
  // 상세 페이지로 이동이 필요한 화면(예: /favorites)에서만 전달한다. 없으면 비클릭 카드.
  detailHref?: string;
}

export function RecommendedCard({ content, detailHref }: RecommendedCardProps) {
  const body = (
    <>
      <div className="relative aspect-video bg-muted">
        {content.imageUrl ? (
          <Image
            src={content.imageUrl}
            alt={content.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            이미지 없음
          </div>
        )}
        {content.category && (
          <span className="absolute top-2 left-2 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
            {CATEGORY_LABELS[content.category]}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="truncate text-sm font-medium">{content.name}</h3>
        <p className="truncate text-xs text-muted-foreground">
          {content.address}
        </p>
      </div>
    </>
  );

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
      {detailHref ? <Link href={detailHref}>{body}</Link> : body}

      <div className="p-3 pt-0">
        <ContentCardActions content={content} />
      </div>
    </div>
  );
}
