import { useMemo } from "react";

import { Icon } from "@/components/ui/icon";
import { dayTravelLabel } from "@/lib/itinerary";
import type { Day } from "@/types/itinerary";
import type { ItineraryMapData } from "@/types/map";
import { DayRouteLegs } from "./DayRouteLegs";
import { CORAL, ItineraryMap } from "./ItineraryMap";

interface DayMapPanelProps {
  days: Day[];
  mapData: ItineraryMapData;
  selectedDayIndex: number;
  // 지도 우상단에 워터마크형 확대 버튼을 올릴지 여부 + 상태/토글. 저장한 일정
  // 펼침(SavedItineraryDetail)에서만 넘긴다 — 없으면 버튼을 그리지 않고
  // 지도 높이도 기존 고정값(h-[300px])을 그대로 쓴다(다른 호출부는 영향 없음).
  expandable?: {
    expanded: boolean;
    onToggle: () => void;
  };
}

// 선택한 일차 하나만 보여주는 고정 지도 + 구간 목록 + 카카오맵 링크.
// 레이아웃 사이드바(sticky)와 단독 렌더(공유 페이지·저장 목록 펼침) 양쪽에서 쓴다.
// 좌표가 있는 장소가 하나도 없으면 아무것도 그리지 않는다.
// 지도는 카드 상단 경계에 붙여(패딩 0) 왼쪽 DayCard 헤더와 시작선을 맞춘다.
// 지도 위 좌상단에 일차·장소 수·이동 요약 배지를 올린다(pointer-events-none으로
// 지도 드래그를 막지 않는다).
export function DayMapPanel({
  days,
  mapData,
  selectedDayIndex,
  expandable,
}: DayMapPanelProps) {
  const day = days[selectedDayIndex];
  const mapDay = day
    ? mapData.days.find((d) => d.dayIndex === day.dayIndex)
    : undefined;
  // ItineraryMap에 넘기는 배열 리터럴을 mapDay가 실제로 바뀔 때만 새로
  // 만든다. 그냥 [mapDay]로 넘기면 expandable.expanded 토글처럼 mapDay와
  // 무관한 리렌더에도 매번 새 배열이 생겨, ItineraryMap의 데이터 이펙트가
  // 다시 돌면서 "고정 구도"가 그 순간(전환 중일 수도 있는) 박스 크기로
  // 덮어써져 버린다.
  const mapDays = useMemo(() => (mapDay ? [mapDay] : []), [mapDay]);

  if (!day || !mapDay || mapDay.points.length === 0) return null;

  const last = mapDay.points[mapDay.points.length - 1];
  const kakaoUrl = `https://map.kakao.com/link/to/${encodeURIComponent(
    last.title,
  )},${last.lat},${last.lng}`;
  const travelLabel = dayTravelLabel(day, mapDay);
  // DayMapPanel/day 뷰는 항상 코랄로 그린다(ItineraryMap이 day 뷰에 쓰는
  // CORAL 상수를 그대로 가져와 값이 어긋나지 않게 한다). dayIndex별 색으로
  // 바꾸면 AI 일정 생성 결과·공유 페이지의 지도 색까지 함께 바뀌므로 이번
  // 범위에서는 하지 않는다.
  const dayColor = CORAL;

  return (
    <section className="overflow-hidden rounded-[20px] border border-border bg-card">
      <div className="relative">
        <ItineraryMap
          variant="day"
          days={mapDays}
          // 접힌(사이드바) 상태는 고정 h-[300px] 그대로. 확대 상태는 폭에
          // 비례해 자라되, 380x300(19:15) 그대로면 너무 커서(폭 1200이면
          // 950 안팎) 그 2/3 높이(19:10 = 15/19 * 2/3)로 낮춘다.
          heightClassName={
            expandable?.expanded ? "aspect-[19/10]" : "h-[300px]"
          }
          // 확대/축소 토글마다(expanded가 바뀔 때) 지도를 고정 구도로
          // 되돌린다 — 박스 모양이 바뀌어도 배율이 흔들리지 않고, 사용자가
          // 지도를 움직여놨어도 항상 같은 화면으로 복귀한다.
          resetViewKey={expandable?.expanded}
          bare
        />

        <div className="pointer-events-none absolute top-3 left-3 z-10 flex items-center gap-2 rounded-[12px] border border-border bg-white/94 px-3 py-2 shadow-[0_6px_18px_-10px_rgba(48,20,12,.5)]">
          <span
            aria-hidden="true"
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: dayColor }}
          />
          <span className="text-[12.5px] font-extrabold text-foreground">
            {day.dayIndex}일차
          </span>
          <span aria-hidden="true" className="h-3 w-px bg-border" />
          <span className="text-[12px] text-[oklch(0.45_0.015_30)]">
            {[`${day.items.length}곳`, travelLabel].filter(Boolean).join(" · ")}
          </span>
        </div>

        {expandable && (
          <button
            type="button"
            onClick={expandable.onToggle}
            aria-label={expandable.expanded ? "지도 축소" : "지도 확대"}
            aria-pressed={expandable.expanded}
            className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/35 text-foreground/60 opacity-70 backdrop-blur-sm transition-all hover:bg-white hover:text-foreground hover:opacity-100 hover:shadow-[0_6px_18px_-10px_rgba(48,20,12,.5)]"
          >
            <Icon
              name={expandable.expanded ? "collapse" : "expand"}
              size={15}
            />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 p-4">
        {travelLabel && (
          <div className="flex items-center justify-between text-[12.5px]">
            <span className="text-muted-foreground">
              {day.dayIndex}일차 구간
            </span>
            <span className="font-extrabold text-foreground">
              {travelLabel}
            </span>
          </div>
        )}

        <DayRouteLegs points={mapDay.points} route={mapDay.route} />

        <a
          href={kakaoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-[12px] border border-border text-[13px] font-bold text-foreground transition-colors hover:bg-muted"
        >
          <Icon name="external-link" size={14} />
          카카오맵에서 경로 열기
        </a>
      </div>
    </section>
  );
}
