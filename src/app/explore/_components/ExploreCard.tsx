import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  CATEGORY_BADGE_CLASSES,
  CATEGORY_LABELS,
  type Content,
} from "@/types/content";

interface ExploreCardProps {
  content: Content;
}

export function ExploreCard({ content }: ExploreCardProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
      <Link href={`/contents/${content.id}?from=explore`} className="block">
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
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_BADGE_CLASSES[content.category]}`}
              >
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
        <Button asChild variant="outline" size="sm" className="mt-1 w-full">
          <Link href={`/contents/${content.id}?from=explore`}>상세 설명</Link>
        </Button>
      </div>
    </div>
  );
}
