"use client";

import Link from "next/link";

import { ContentCardActions } from "@/components/ContentCardActions";
import { ContentImage } from "@/components/ContentImage";
import { CATEGORY_LABELS, type Content } from "@/types/content";
import { REGION_LABELS } from "@/types/region";

interface RecommendedCardProps {
  content: Content;
  // 상세 페이지로 이동이 필요한 화면(예: /favorites)에서만 전달한다. 없으면 비클릭 카드.
  detailHref?: string;
}

// ContentCard와 동일한 본문(썸네일 위 코랄 카테고리 배지 + 우상단 반투명 지역
// 배지 / 제목 / 주소 / 요약)에 찜·담기 액션을 붙인 카드. detailHref가 있으면
// 본문이 상세 페이지 링크가 되고, 없으면 비클릭(대시보드 추천 스트립).
export function RecommendedCard({ content, detailHref }: RecommendedCardProps) {
  const body = (
    <>
      <div className="relative aspect-[4/3] bg-muted">
        <ContentImage
          src={content.imageUrl}
          alt={content.name}
          category={content.category}
          size="lg"
          sizes="(max-width: 640px) 50vw, 25vw"
        />
        {content.category && (
          <span className="absolute top-2.5 left-2.5 rounded-full bg-primary px-2.5 py-1 text-[10.5px] font-extrabold text-primary-foreground">
            {CATEGORY_LABELS[content.category]}
          </span>
        )}
        <span className="absolute top-2.5 right-2.5 rounded-full bg-white/90 px-2.5 py-1 text-[10.5px] font-extrabold text-foreground shadow-sm backdrop-blur-sm">
          {REGION_LABELS[content.region]}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4 pb-2">
        <h3 className="truncate text-[14.5px] font-bold tracking-tight text-foreground">
          {content.name}
        </h3>
        <p className="truncate text-xs text-muted-foreground">
          {content.address}
        </p>
        <p className="line-clamp-2 text-sm text-foreground/80">
          {content.summary}
        </p>
      </div>
    </>
  );

  return (
    <div
      className={`flex h-full flex-col overflow-hidden rounded-[18px] border border-border bg-card ${
        detailHref
          ? "transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
          : ""
      }`}
    >
      {detailHref ? <Link href={detailHref}>{body}</Link> : body}

      <div className="mt-auto p-4 pt-2">
        <ContentCardActions content={content} />
      </div>
    </div>
  );
}
