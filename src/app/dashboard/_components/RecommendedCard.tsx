"use client";

import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useBasket } from "@/hooks/useBasket";
import { useFavorites } from "@/hooks/useFavorites";
import {
  CATEGORY_BADGE_CLASSES,
  CATEGORY_LABELS,
  type Content,
} from "@/types/content";

interface RecommendedCardProps {
  content: Content;
}

export function RecommendedCard({ content }: RecommendedCardProps) {
  const { isInBasket, add, remove } = useBasket();
  const {
    isFavorited,
    add: addFavorite,
    remove: removeFavorite,
  } = useFavorites();

  const inBasket = isInBasket(content.id);
  const favorited = isFavorited(content.id);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
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
          <span
            className={`absolute top-2 left-2 rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_BADGE_CLASSES[content.category]}`}
          >
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

      <div className="flex items-center justify-between gap-2 p-3 pt-0">
        <button
          type="button"
          aria-label={favorited ? "찜 해제" : "찜하기"}
          aria-pressed={favorited}
          onClick={() =>
            favorited ? removeFavorite(content.id) : addFavorite(content)
          }
          className={favorited ? "text-destructive" : "text-muted-foreground"}
        >
          <Icon name="heart" size={18} />
        </button>

        <Button
          variant={inBasket ? "outline" : "destructive"}
          size="sm"
          onClick={() => (inBasket ? remove(content.id) : add(content))}
        >
          <Icon name={inBasket ? "check" : "plus"} size={14} />
          {inBasket ? "담김" : "담기"}
        </Button>
      </div>
    </div>
  );
}
