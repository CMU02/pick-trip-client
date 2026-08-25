"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Icon } from "@/components/ui/icon";
import { useBasket } from "@/hooks/useBasket";
import { useFavorites } from "@/hooks/useFavorites";
import { useRecentViews } from "@/hooks/useRecentViews";
import { CATEGORY_LABELS, type ContentDetail } from "@/types/content";
import { REGION_LABELS } from "@/types/region";

interface ContentDetailViewProps {
  content: ContentDetail;
  showBasketAction?: boolean;
  backHref?: string;
}

interface InfoRowProps {
  label: string;
  value: string | null;
}

// 핸드오프 스펙(12번 "콘텐츠 상세")의 2열 스펙 행. 값이 없는 필드는
// 숨기지 않고 "정보 없음"으로 표시한다(기존 동작 유지).
function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex items-center justify-between rounded-[13px] bg-[oklch(0.975_0.01_30)] px-4 py-3.5">
      <span className="text-[12.5px] text-muted-foreground">{label}</span>
      <span
        className={`text-[13px] font-bold ${value ? "text-foreground" : "text-muted-foreground"}`}
      >
        {value ?? "정보 없음"}
      </span>
    </div>
  );
}

export function ContentDetailView({
  content,
  showBasketAction = true,
  backHref,
}: ContentDetailViewProps) {
  const router = useRouter();
  const { items, add, remove } = useBasket();
  const {
    items: favoriteItems,
    add: addFavorite,
    remove: removeFavorite,
  } = useFavorites();
  const { addView } = useRecentViews();
  const inBasket = items.some((i) => i.content.id === content.id);
  const favorited = favoriteItems.some((c) => c.id === content.id);

  // 콘텐츠 상세 진입 시(/contents, /explore 어느 경로든) 최근 본 콘텐츠로 기록한다.
  useEffect(() => {
    addView(content);
  }, [content, addView]);

  const allImages = [
    ...(content.imageUrl ? [content.imageUrl] : []),
    ...content.imageUrls,
  ];

  const parkingText =
    content.parking === null ? null : content.parking ? "가능" : "불가능";

  const reservationText =
    content.reservationRequired === null
      ? null
      : content.reservationRequired
        ? "필요"
        : "불필요";

  const rows: InfoRowProps[] = [
    { label: "지역", value: REGION_LABELS[content.region] },
    { label: "운영 시간", value: content.operatingHours },
    { label: "휴무일", value: content.closedDay },
    { label: "주차", value: parkingText },
    { label: "예상 체류 시간", value: content.stayDuration },
    { label: "예약", value: reservationText },
    ...(content.dataSource
      ? [{ label: "데이터 출처", value: content.dataSource }]
      : []),
  ];

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      {backHref ? (
        <Link
          href={backHref}
          className="mb-4 inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground"
        >
          ← 목록으로
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground"
        >
          ← 목록으로
        </button>
      )}

      <div className="relative mb-6 h-[230px] overflow-hidden rounded-[24px] bg-muted">
        {allImages.length > 0 ? (
          <Image
            src={allImages[0]}
            alt={content.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 672px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            이미지 없음
          </div>
        )}
        {content.category && (
          <span className="absolute top-3.5 left-3.5 rounded-full bg-primary px-3.5 py-1.5 text-[11.5px] font-extrabold text-primary-foreground">
            {CATEGORY_LABELS[content.category]}
          </span>
        )}
      </div>

      <div className="flex items-start justify-between gap-5">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight">
            {content.name}
          </h1>
          <p className="mt-2 text-[13.5px] text-muted-foreground">
            {content.address}
          </p>
        </div>
        {showBasketAction && (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              aria-label={favorited ? "찜 해제" : "찜하기"}
              aria-pressed={favorited}
              onClick={() =>
                favorited ? removeFavorite(content.id) : addFavorite(content)
              }
              className={`flex h-11 w-11 items-center justify-center rounded-xl border border-border ${favorited ? "text-destructive" : "text-muted-foreground"}`}
            >
              <Icon name="heart" size={19} />
            </button>
            <button
              type="button"
              onClick={() => (inBasket ? remove(content.id) : add(content))}
              className={`flex h-11 items-center gap-1.5 rounded-xl px-5 text-sm font-bold transition-colors ${
                inBasket
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-accent text-accent-foreground hover:bg-accent/80"
              }`}
            >
              <Icon name={inBasket ? "check" : "plus"} size={15} />
              {inBasket ? "담김" : "담기"}
            </button>
          </div>
        )}
      </div>

      <p className="mt-4.5 text-[14.5px] leading-relaxed text-foreground/80">
        {content.summary}
      </p>

      <div className="mt-5.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {rows.map((row) => (
          <InfoRow key={row.label} label={row.label} value={row.value} />
        ))}
      </div>
    </div>
  );
}
