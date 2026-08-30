"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { ContentImage } from "@/components/ContentImage";
import { getNearbyContents } from "@/services/contentService";
import { CATEGORY_LABELS, type NearbyContent } from "@/types/content";

interface NearbyContentsProps {
  contentId: string;
  // 상세 진입 경로(?from=). 근처 카드로 넘어갈 때도 같은 맥락을 유지한다.
  fromParam?: string;
}

// 왼쪽 열 맨 아래 3칸. 좌표 기반 조회라 원본 콘텐츠에 좌표가 있을 때만
// 부모가 마운트한다(좌표 없으면 서버가 404 CONTENT_LOCATION_UNKNOWN).
const NEARBY_SIZE = 3;

// 콘텐츠 동기화 배치가 주 1회라 넉넉히 잡아 같은 상세를 오가도 재요청하지 않는다.
const NEARBY_STALE_TIME = 60 * 60 * 1000;

function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

// 도로 거리(ROAD)면 자동차 소요 시간을, 길찾기가 실패해 직선거리로 폴백한
// 경우(STRAIGHT)면 그 사실을 밝히며 거리를 보여준다.
function formatNearbyMeta(content: NearbyContent): string {
  if (
    content.distanceBasis === "ROAD" &&
    content.durationMinutes !== undefined
  ) {
    return `차로 약 ${content.durationMinutes}분`;
  }
  return `직선거리 약 ${formatDistance(content.distanceKm)}`;
}

export function NearbyContents({ contentId, fromParam }: NearbyContentsProps) {
  const { data } = useQuery({
    // "contents" 접두어를 피해 목록 캐시(로컬 스토리지 영속화)와 분리한다.
    queryKey: ["nearby-contents", contentId, NEARBY_SIZE],
    queryFn: () => getNearbyContents(contentId, { size: NEARBY_SIZE }),
    staleTime: NEARBY_STALE_TIME,
  });

  const contents = data?.contents ?? [];
  // 로딩 중이거나, 근처에 아무것도 없거나, 조회가 실패하면 섹션을 통째로 숨긴다.
  if (contents.length === 0) return null;

  const suffix = fromParam ? `?from=${encodeURIComponent(fromParam)}` : "";

  return (
    <section className="mt-10">
      <h2 className="text-[17px] font-extrabold tracking-[-0.03em]">
        근처 콘텐츠
      </h2>
      <div className="mt-3.5 grid grid-cols-3 gap-2.5 sm:gap-3.5">
        {contents.map((content) => (
          <Link
            key={content.id}
            href={`/contents/${content.id}${suffix}`}
            className="flex flex-col overflow-hidden rounded-[14px] border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <div className="relative aspect-[4/3] bg-muted">
              <ContentImage
                src={content.imageUrl}
                alt={content.name}
                category={content.category}
                size="sm"
                sizes="(max-width: 640px) 33vw, 200px"
              />
            </div>
            <div className="flex flex-col gap-1 p-2.5">
              <h3 className="truncate text-[13px] font-bold tracking-tight text-foreground">
                {content.name}
              </h3>
              <p className="truncate text-[11.5px] text-muted-foreground">
                {formatNearbyMeta(content)}
                {content.category
                  ? ` · ${CATEGORY_LABELS[content.category]}`
                  : ""}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
