import { authHeaders } from "@/lib/http";
import { apiClient } from "@/services/apiClient";
import type {
  Day,
  ItineraryGenerateResponse,
  ItineraryResponse,
  RawGeneratedDay,
  RawItineraryGenerateResponse,
  SaveItineraryRequest,
} from "@/types/itinerary";

// 프론트는 duration을 UI 개념인 "박 수"(당일치기=0)로 다루지만, 백엔드는
// "일수"(당일치기=1, 최소 1)로 정의한다(.agents/docs/domain-model.md). 서비스
// 경계에서만 변환해 나머지 화면 코드는 계속 박 수 기준으로 다루게 한다.
function nightsToServerDuration(nights: number): number {
  return nights + 1;
}

function serverDurationToNights(duration: number): number {
  return duration - 1;
}

// 생성 응답은 저장 전 미리보기라 dayId/itemId/pinned가 없다. 화면(DayCard,
// 순서 이동/삭제)은 저장된 일정과 같은 Day[]를 전제로 id를 key와 조작 대상으로
// 쓰므로, 여기서 응답 안에서만 유일한 id를 합성해 채운다. 저장 후에는 서버가
// 발급한 진짜 id로 교체된다.
function withSyntheticIds(days: RawGeneratedDay[]): Day[] {
  return days.map((day) => ({
    dayId: `generated-day-${day.dayIndex}`,
    dayIndex: day.dayIndex,
    // 저장/공유 응답과 달리 generate 응답에만 오는 필드까지 명시적으로 옮긴다.
    // undefined가 아닌 null/[]로 정규화해 화면·테스트에서 다루기 쉽게 한다.
    date: day.date ?? null,
    totalTravelMinutes: day.totalTravelMinutes ?? null,
    totalTravelKm: day.totalTravelKm ?? null,
    dayNotes: day.dayNotes ?? [],
    items: day.items.map((item) => ({
      itemId: `generated-item-${day.dayIndex}-${item.order}-${item.contentId}`,
      contentId: item.contentId,
      title: item.title,
      order: item.order,
      reason: item.reason,
      pinned: false,
      startTime: item.startTime ?? null,
      endTime: item.endTime ?? null,
      notes: item.notes ?? [],
    })),
  }));
}

// generate는 요청 바디를 받지 않는다 — 서버에 저장된 사용자의 바구니/조건을 읽어 생성한다.
// 호출 전에 basketService로 바구니/조건을 서버에 반영해야 한다.
export async function generateItinerary(
  accessToken?: string,
): Promise<ItineraryGenerateResponse> {
  const { data } = await apiClient.post<RawItineraryGenerateResponse>(
    "/api/v1/itineraries/generate",
    undefined,
    { headers: authHeaders(accessToken) },
  );
  return {
    ...data,
    duration: serverDurationToNights(data.duration),
    days: withSyntheticIds(data.days),
    adjustments: data.adjustments ?? [],
  };
}

export async function saveItinerary(
  request: SaveItineraryRequest,
  accessToken?: string,
): Promise<ItineraryResponse> {
  const { data } = await apiClient.post<ItineraryResponse>(
    "/api/v1/itineraries",
    { ...request, duration: nightsToServerDuration(request.duration) },
    { headers: authHeaders(accessToken) },
  );
  return { ...data, duration: serverDurationToNights(data.duration) };
}

export async function getItinerary(
  itineraryId: string,
  accessToken?: string,
): Promise<ItineraryResponse> {
  const { data } = await apiClient.get<ItineraryResponse>(
    `/api/v1/itineraries/${itineraryId}`,
    { headers: authHeaders(accessToken) },
  );
  return { ...data, duration: serverDurationToNights(data.duration) };
}

export async function modifyItinerary(
  itineraryId: string,
  request: SaveItineraryRequest,
  accessToken?: string,
): Promise<ItineraryResponse> {
  const { data } = await apiClient.patch<ItineraryResponse>(
    `/api/v1/itineraries/${itineraryId}`,
    { ...request, duration: nightsToServerDuration(request.duration) },
    { headers: authHeaders(accessToken) },
  );
  return { ...data, duration: serverDurationToNights(data.duration) };
}
