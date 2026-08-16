import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CATEGORY_LABELS, type Content } from "@/types/content";

interface ExploreCardProps {
  content: Content;
}

// 담기(바구니) 없는 콘텐츠 탐색 카드 — 이슈 #57에서 의도적으로 결정된 동작.
// 핸드오프 문서(5번 "둘러보기")의 카드는 찜/담기 pill을 포함하지만, 이
// 기존 제품 결정을 우선해 시각 스타일(코랄 배지, 호버, 이미지 높이)만 반영한다.
export function ExploreCard({ content }: ExploreCardProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[18px] border border-border bg-card transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
      <Link href={`/contents/${content.id}?from=explore`} className="block">
        <div className="relative h-[150px] bg-muted">
          {content.imageUrl ? (
            <Image
              src={content.imageUrl}
              alt={content.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              이미지 없음
            </div>
          )}
          {content.category && (
            <span className="absolute top-2.5 left-2.5 rounded-full bg-primary px-2.5 py-1 text-[10.5px] font-extrabold text-primary-foreground">
              {CATEGORY_LABELS[content.category]}
            </span>
          )}
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
        <Button asChild variant="outline" size="sm" className="mt-1 w-full">
          <Link href={`/contents/${content.id}?from=explore`}>상세 설명</Link>
        </Button>
      </div>
    </div>
  );
}
