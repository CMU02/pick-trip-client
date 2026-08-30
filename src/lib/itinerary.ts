import type { Day, DayRequest } from "@/types/itinerary";
import type { ItineraryMapDay } from "@/types/map";

export function formatDuration(duration: number) {
  return duration === 0 ? "당일치기" : `${duration}박 ${duration + 1}일`;
}

// 백엔드가 내려주는 방문 시각·이동 요약·날짜를 화면 문구로 바꾸는 포매터.
// 모두 "보여줄 게 없으면 null"을 반환해, 호출부는 {formatX(...) && <chip>}로 쓴다.

/** "09:30","11:00" → "09:30 – 11:00". 한쪽만 있으면 그쪽만. 둘 다 없으면 null. */
export function formatTimeRange(
  start?: string | null,
  end?: string | null,
): string | null {
  if (start && end) return `${start} – ${end}`;
  return start || end || null;
}

/** 45 → "45분", 90 → "1시간 30분", 120 → "2시간". null/0 → null. */
export function formatTravelMinutes(minutes?: number | null): string | null {
  if (!minutes || minutes <= 0) return null;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}분`;
  if (mins === 0) return `${hours}시간`;
  return `${hours}시간 ${mins}분`;
}

/** 12.4 → "12.4km", 12 → "12km". null/0 → null. */
export function formatDistanceKm(km?: number | null): string | null {
  if (!km || km <= 0) return null;
  const rounded = Math.round(km * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}km`;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

/** "2025-05-03" → "5월 3일 (토)". null/형식 불일치 → null. */
export function formatDayDate(date?: string | null): string | null {
  if (!date) return null;
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return null;
  // new Date("2025-05-03")은 UTC 파싱이라 음수 오프셋에서 하루 밀린다.
  // 지역 파츠로 생성해야 요일이 맞는다.
  const weekday = WEEKDAYS[new Date(y, m - 1, d).getDay()];
  return `${m}월 ${d}일 (${weekday})`;
}

/**
 * 일자별 이동값을 합산한다. 어떤 날도 이동값이 없으면 둘 다 null(=표시 안 함),
 * 하나라도 있으면 non-null 값만 더한다.
 */
export function sumDayTravel(days: Day[]): {
  totalMinutes: number | null;
  totalKm: number | null;
} {
  let totalMinutes: number | null = null;
  let totalKm: number | null = null;
  for (const day of days) {
    if (typeof day.totalTravelMinutes === "number") {
      totalMinutes = (totalMinutes ?? 0) + day.totalTravelMinutes;
    }
    if (typeof day.totalTravelKm === "number") {
      totalKm = (totalKm ?? 0) + day.totalTravelKm;
    }
  }
  return {
    totalMinutes,
    totalKm: totalKm === null ? null : Math.round(totalKm * 10) / 10,
  };
}

/**
 * 한 날의 이동 합계 "34분 · 27.6km". Kakao 길찾기(실도로) route 결과가 있으면
 * 우선, 없으면 백엔드 스케줄러 값(day.totalTravel*)으로 폴백한다. 둘 다 없으면 null.
 * DayCard 헤더와 DayMapPanel 구간 헤더행이 같은 값을 쓰도록 공유한다.
 */
export function dayTravelLabel(
  day: Day,
  mapDay?: ItineraryMapDay | null,
): string | null {
  const route = mapDay?.route ?? null;
  const duration = route
    ? formatTravelMinutes(Math.round(route.totalDurationSeconds / 60))
    : formatTravelMinutes(day.totalTravelMinutes);
  const distance = route
    ? formatDistanceKm(route.totalDistanceMeters / 1000)
    : formatDistanceKm(day.totalTravelKm);
  const label = [duration, distance].filter(Boolean).join(" · ");
  return label || null;
}

/** 장소가 0개인 날이 하나라도 있는지. 저장은 이런 날을 400으로 거부한다. */
export function hasEmptyDay(days: Day[]): boolean {
  return days.some((day) => day.items.length === 0);
}

/**
 * 저장/수정 요청 body의 days 프로젝션. 미리보기에서 받은 방문 시각·이동 요약을
 * 그대로 왕복시킨다(서버는 저장 시 스케줄러를 다시 돌리지 않는다). null은
 * ?? undefined로 바꿔 JSON에서 생략한다. 빈 날은 거르지 않는다(저장 버튼에서 차단).
 */
export function toSaveDays(days: Day[]): DayRequest[] {
  return days.map((day) => ({
    dayIndex: day.dayIndex,
    totalTravelMinutes: day.totalTravelMinutes ?? undefined,
    totalTravelKm: day.totalTravelKm ?? undefined,
    items: day.items.map((item) => ({
      contentId: item.contentId,
      title: item.title,
      order: item.order,
      reason: item.reason,
      pinned: item.pinned ?? false,
      startTime: item.startTime ?? undefined,
      endTime: item.endTime ?? undefined,
    })),
  }));
}
