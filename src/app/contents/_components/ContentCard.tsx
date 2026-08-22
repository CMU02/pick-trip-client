"use client";

import Image from "next/image";
import Link from "next/link";

import { ContentCardActions } from "@/components/ContentCardActions";
import { CATEGORY_LABELS, type Content } from "@/types/content";
import { REGION_LABELS } from "@/types/region";

interface ContentCardProps {
  content: Content;
}

// 핸드오프 스펙(4번 "콘텐츠 목록")에 맞춰 재구성: 카테고리 배지를 이미지 위
// 코랄 단색 오버레이로, 담기/찜 액션은 ContentCardActions(ForYouCard와 동일
// 컴포넌트)로 자체 관리한다. 바구니 상태를 상위(ContentGrid)에서 prop으로
// 내려주던 방식은 제거했다.
export function ContentCard({ content }: ContentCardProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[18px] border border-border bg-card transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
      <Link href={`/contents/${content.id}`} className="block">
        <div className="relative h-[140px] bg-muted">
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
          <div className="absolute top-2.5 left-2.5 flex gap-1.5">
            {content.category && (
              <span className="rounded-full bg-primary px-2.5 py-1 text-[10.5px] font-extrabold text-primary-foreground">
                {CATEGORY_LABELS[content.category]}
              </span>
            )}
            <span className="rounded-full bg-primary px-2.5 py-1 text-[10.5px] font-extrabold text-primary-foreground">
              {REGION_LABELS[content.region]}
            </span>
          </div>
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
