"use client";

import Image from "next/image";
import Link from "next/link";

import { ContentCardActions } from "@/components/ContentCardActions";
import { CATEGORY_LABELS, type Content } from "@/types/content";

interface ForYouCardProps {
  content: Content;
}

// ExploreCard와 동일한 본문(이미지/뱃지/제목/주소/요약)에 "상세 설명" 버튼 대신
// 찜/담기 액션(ContentCardActions)을 붙인 카드. FOR YOU 더보기 페이지 전용.
export function ForYouCard({ content }: ForYouCardProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
      <Link href={`/contents/${content.id}?from=for-you`} className="block">
        <div className="relative aspect-video bg-muted">
          {content.imageUrl ? (
            <Image
              src={content.imageUrl}
              alt={content.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              이미지 없음
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 p-4 pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium leading-tight">{content.name}</h3>
            {content.category && (
              <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                {CATEGORY_LABELS[content.category]}
              </span>
            )}
          </div>

          <p className="text-xs text-muted-foreground">{content.address}</p>
          <p className="line-clamp-2 text-sm text-foreground/80">
            {content.summary}
          </p>
        </div>
      </Link>

      <div className="mt-auto p-4 pt-2">
        <ContentCardActions content={content} />
      </div>
    </div>
  );
}
