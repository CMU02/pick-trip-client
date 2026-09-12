import { Icon } from "@/components/ui/icon";
import { visitorStatsCaption } from "@/lib/content";
import type { VisitorStats } from "@/types/content";

// 콘텐츠 카드(ContentCard·ExploreCard·ForYouCard·RecommendedCard) 공용 방문자수
// 캡션. visitorStats가 없으면 아무것도 그리지 않아 기존 카드와 레이아웃이
// 동일하게 유지된다.
export function VisitorStatsCaption({
  stats,
}: {
  stats?: VisitorStats | null;
}) {
  const caption = visitorStatsCaption(stats);
  if (!caption) return null;

  return (
    <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
      <Icon name="user" size={11} className="shrink-0" />
      {caption}
    </p>
  );
}
