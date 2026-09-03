import {
  formatDistanceKm,
  formatTravelMinutes,
  sumStayMinutes,
} from "@/lib/itinerary";
import type { BasketItem, BasketPriority } from "@/types/basket";
import { PRIORITY_LABELS } from "@/types/basket";
import type { Day } from "@/types/itinerary";
import type { Region } from "@/types/region";
import { REGION_LABELS } from "@/types/region";
import type { CompanionCondition } from "@/types/travel-condition";
import { COMPANION_CONDITION_LABELS } from "@/types/travel-condition";

interface TripSummaryProps {
  regions: Region[];
  startDate: string;
  nights: number;
  companions: CompanionCondition[];
  items: BasketItem[];
  // 일정 생성 결과 화면에서는 담은 콘텐츠가 이미 일차 카드에 전부 나와 있어
  // 중복 표시를 피하려고 개수만 보여준다(기본값 true = 목록까지 표시).
  showItemList?: boolean;
  // 생성 완료 후에는 로컬 바구니가 비워지므로(ItineraryClient), 결과 화면에서는
  // items.length 대신 실제 일정에 담긴 장소 수를 이 값으로 넘겨 표시한다.
  itemCount?: number;
  // 백엔드 스케줄러가 내려준 일자별 이동값 합계. 호출부가 precompute해서 넘긴다
  // (편집기 경로는 라이브 재계산이 필요해 TripSummary가 직접 안 계산한다).
  travelSummary?: {
    totalMinutes: number | null;
    totalKm: number | null;
  } | null;
  // 첫 날 첫 장소의 방문 시각("HH:mm"). 호출부가 days[0].items[0].startTime로 넘긴다.
  departureTime?: string | null;
  // 생성/저장 결과의 일자 배열. 넘기면 일정 규모·하루 평균·총 머무는 시간 행을 더한다.
  days?: Day[];
}

const PRIORITY_ORDER: (BasketPriority | null)[] = [
  "MUST",
  "SHOULD",
  "OPTIONAL",
  null,
];

export function TripSummary({
  regions,
  startDate,
  nights,
  companions,
  items,
  showItemList = true,
  itemCount,
  travelSummary,
  departureTime,
  days,
}: TripSummaryProps) {
  const displayCount = itemCount ?? items.length;
  const travelDuration = formatTravelMinutes(travelSummary?.totalMinutes);
  const travelDistance = formatDistanceKm(travelSummary?.totalKm);

  // days가 오면 파생 요약 행을 계산한다.
  const summaryDays = days ?? [];
  const hasDays = summaryDays.length > 0;
  const totalPlaces = summaryDays.reduce((sum, d) => sum + d.items.length, 0);
  const avgPerDay = hasDays
    ? Math.max(1, Math.round(totalPlaces / summaryDays.length))
    : 0;
  const stayTotal = formatTravelMinutes(sumStayMinutes(summaryDays));
  // 조건 없이 /itinerary로 직접 들어오면 startDate가 빈 문자열이라 "NaN월 NaN일"이
  // 되던 자리다. 조건 요약을 보여주는 /contents와 같은 문구로 맞춘다.
  const [, month, day] = startDate.split("-");
  const formattedDate =
    month && day ? `${Number(month)}월 ${Number(day)}일` : "날짜 미선택";
  const duration = nights === 0 ? "당일치기" : `${nights}박 ${nights + 1}일`;
  const regionText = regions.map((r) => REGION_LABELS[r]).join(", ");

  const groupedItems = PRIORITY_ORDER.map((priority) => ({
    priority,
    items: items.filter((item) => item.priority === priority),
  })).filter(({ items: groupItems }) => groupItems.length > 0);

  return (
    <section className="rounded-[20px] border border-border bg-card p-5.5">
      <h2 className="text-[17px] font-bold tracking-tight text-foreground">
        여행 요약
      </h2>
      <dl className="mt-4 flex flex-col gap-2.5 text-[13.5px]">
        <div className="flex items-start justify-between gap-3">
          <dt className="text-muted-foreground">지역</dt>
          <dd className="text-right font-bold text-foreground">{regionText}</dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="text-muted-foreground">날짜</dt>
          <dd className="text-right font-bold text-foreground">
            {formattedDate}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="text-muted-foreground">기간</dt>
          <dd className="text-right font-bold text-foreground">{duration}</dd>
        </div>
        {companions.length > 0 && (
          <div className="flex items-start justify-between gap-3">
            <dt className="shrink-0 text-muted-foreground">동행 조건</dt>
            <dd className="flex flex-wrap justify-end gap-1">
              {companions.map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-muted px-2 py-0.5 text-xs text-foreground"
                >
                  {COMPANION_CONDITION_LABELS[c]}
                </span>
              ))}
            </dd>
          </div>
        )}
        {departureTime && (
          <div className="flex items-start justify-between gap-3">
            <dt className="text-muted-foreground">출발 시각</dt>
            <dd className="text-right font-bold tabular-nums text-foreground">
              {departureTime}
            </dd>
          </div>
        )}
        {hasDays && (
          <div className="flex items-start justify-between gap-3">
            <dt className="text-muted-foreground">일정 규모</dt>
            <dd className="text-right font-bold text-foreground">
              {summaryDays.length}일 · 총 {totalPlaces}곳
            </dd>
          </div>
        )}
        {hasDays && (
          <div className="flex items-start justify-between gap-3">
            <dt className="text-muted-foreground">하루 평균</dt>
            <dd className="text-right font-bold text-foreground">
              약 {avgPerDay}곳
            </dd>
          </div>
        )}
        {stayTotal && (
          <div className="flex items-start justify-between gap-3">
            <dt className="text-muted-foreground">총 머무는 시간</dt>
            <dd className="text-right font-bold text-foreground">
              {stayTotal}
            </dd>
          </div>
        )}
        {travelDuration && (
          <div className="flex items-start justify-between gap-3">
            <dt className="text-muted-foreground">총 이동 시간</dt>
            <dd className="text-right font-bold text-foreground">
              {travelDuration}
            </dd>
          </div>
        )}
        {travelDistance && (
          <div className="flex items-start justify-between gap-3">
            <dt className="text-muted-foreground">총 이동 거리</dt>
            <dd className="text-right font-bold text-foreground">
              {travelDistance}
            </dd>
          </div>
        )}
        {showItemList ? (
          <div>
            <dt className="text-muted-foreground">담은 콘텐츠</dt>
            {items.length === 0 ? (
              <dd className="mt-1 text-muted-foreground">
                담은 콘텐츠가 없습니다
              </dd>
            ) : (
              <dd className="mt-1.5 space-y-2">
                {groupedItems.map(({ priority, items: groupItems }) => (
                  <div key={priority ?? "none"}>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        priority
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {priority ? PRIORITY_LABELS[priority] : "미분류"}
                    </span>
                    <ul className="mt-1 space-y-0.5">
                      {groupItems.map((item) => (
                        <li
                          key={item.content.id}
                          className="text-sm text-foreground"
                        >
                          {item.content.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </dd>
            )}
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <dt className="text-muted-foreground">담은 콘텐츠</dt>
            <dd className="text-right font-bold text-foreground">
              {displayCount}개
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}
