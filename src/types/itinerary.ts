import type { Region } from "@/types/region";

// ── 저장/수정 요청 공용 (POST save, PATCH modify) ──────────────────
export interface SaveItineraryRequest {
  title: string;
  region: Region;
  travelDate: string; // "YYYY-MM-DD"
  duration: number;
  days: DayRequest[];
}

export interface DayRequest {
  dayIndex: number;
  items: ItemRequest[];
  // 미리보기에서 받은 하루 이동 요약을 그대로 되돌려 저장한다(서버는 저장 시
  // 스케줄러를 다시 돌리지 않으므로 클라이언트가 왕복시켜야 값이 유지된다).
  totalTravelMinutes?: number;
  totalTravelKm?: number;
}

export interface ItemRequest {
  contentId: string;
  title?: string;
  order?: number;
  reason?: string;
  pinned?: boolean;
  // 미리보기에서 받은 방문 시각("HH:mm")을 그대로 되돌려 저장한다.
  startTime?: string;
  endTime?: string;
}

// ── 조회/저장/수정 응답 공용 (GET, POST save, PATCH modify) ──────────
export interface ItineraryResponse {
  itineraryId: string;
  title: string;
  region: Region;
  travelDate: string;
  duration: number;
  lastModifiedAt: string; // ISO 8601
  days: Day[];
}

export interface Day {
  dayId: string;
  dayIndex: number;
  items: Item[];
  // 하루 이동 요약. 조회/저장/공유 응답 + generate 응답 모두에 있다(nullable).
  totalTravelMinutes?: number | null;
  totalTravelKm?: number | null;
  // date/dayNotes는 generate(미리보기) 응답 전용 — 저장·공유 응답에는 없다.
  date?: string | null; // "yyyy-MM-dd"
  dayNotes?: string[];
}

export interface Item {
  itemId: string;
  contentId: string;
  title: string;
  order: number;
  reason: string;
  pinned: boolean;
  // 방문 시각("HH:mm"). 조회/저장/공유 + generate 응답 모두에 있다(nullable).
  startTime?: string | null;
  endTime?: string | null;
  // notes는 generate(미리보기) 응답 전용 — 저장·공유 응답에는 없다.
  notes?: string[];
}

// ── 생성 응답 (POST /api/v1/itineraries/generate) ───────────────────
// generate는 요청 바디를 받지 않는다 — 서버에 저장된 사용자의 바구니/조건을 읽어 생성한다.
// 아직 저장 전이라 서버 응답에는 dayId/itemId/pinned가 없다. 화면은 저장된 일정과
// 같은 Day[]로 다루므로 itineraryService가 서비스 경계에서 id를 합성해 채운다.
export interface RawGeneratedDay {
  dayIndex: number;
  items: RawGeneratedItem[];
  date: string | null;
  totalTravelMinutes: number | null;
  totalTravelKm: number | null;
  dayNotes: string[];
}

export interface RawGeneratedItem {
  contentId: string;
  title: string;
  order: number;
  reason: string;
  startTime: string | null;
  endTime: string | null;
  notes: string[];
}

export interface RawItineraryGenerateResponse {
  title: string;
  region: Region;
  travelDate: string;
  duration: number;
  days: RawGeneratedDay[];
  // 스케줄러가 AI 안을 어떻게 바꿨는지 설명하는 여정 단위 안내 문구. 서버가
  // 항상 보낸다(빈 배열일 수 있음). generate 응답에만 있다.
  adjustments: string[];
}

export interface ItineraryGenerateResponse {
  title: string;
  region: Region;
  travelDate: string;
  duration: number;
  days: Day[];
  adjustments: string[];
}

// ── 저장한 일정 목록 (브라우저 로컬 저장, 서버 계약 아님) ───────────
// 로그인 + 서버 목록 조회 API가 없어 이 브라우저에 저장한 기록만 관리한다.
export interface SavedItinerarySummary {
  itineraryId: string;
  title: string;
  region: Region;
  travelDate: string;
  duration: number;
  savedAt: number; // Date.now()
}

// ── 공유 (POST /api/v1/itineraries/{itineraryId}/share) ─────────────
export interface ShareCreateResponse {
  token: string;
  shareUrl: string;
}

// ── 공유 조회 (GET /api/v1/share/{token}) ────────────────────────────
// 비로그인 사용자도 접근 가능한 공개·읽기 전용 응답이라 itineraryId를 노출하지 않는다.
export interface SharedItineraryResponse {
  title: string;
  region: Region;
  travelDate: string;
  duration: number;
  days: Day[];
}
