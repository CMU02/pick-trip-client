"use client";

import Link from "next/link";

import { ContentCardActions } from "@/components/ContentCardActions";
import { ContentImage } from "@/components/ContentImage";
import { CATEGORY_LABELS, type Content } from "@/types/content";
import { REGION_LABELS } from "@/types/region";

interface TryItCardProps {
  content: Content;
}

// 홈 "여기서 바로 담아보세요" 카드. For You / 콘텐츠 목록 카드와 같은 본문
// (썸네일 위 코랄 카테고리 배지 + 우상단 지역 배지 / 제목 / 주소 / 요약)에
// 찜·담기 액션(ContentCardActions)을 붙인다. 상세 링크에 ?from을 붙이지 않아
// 상세 화면에서 담기 버튼이 노출된다(page.tsx: from !== "explore").
export function TryItCard({ content }: TryItCardProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[18px] border border-border bg-card transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
      <Link href={`/contents/${content.id}`} className="block">
        <div className="relative h-[140px] bg-muted">
          <ContentImage
            src={content.imageUrl}
            alt={content.name}
            category={content.category}
            size="lg"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
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

        <div className="flex flex-col gap-1.5 p-4 pb-2">
          <h3 className="text-[14.5px] font-bold tracking-tight text-foreground">
            {content.name}
          </h3>
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
