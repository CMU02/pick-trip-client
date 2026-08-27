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
}

export interface ItemRequest {
  contentId: string;
  title?: string;
  order?: number;
  reason?: string;
  pinned?: boolean;
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
}

export interface Item {
  itemId: string;
  contentId: string;
  title: string;
  order: number;
  reason: string;
  pinned: boolean;
  // 백엔드 Item 스키마에는 startTime/endTime/stayDuration/needsVerification이 없다.
  // 화면 표시용으로 필요하면 별도 확인 후 추가한다.
}

// ── 생성 응답 (POST /api/v1/itineraries/generate) ───────────────────
// generate는 요청 바디를 받지 않는다 — 서버에 저장된 사용자의 바구니/조건을 읽어 생성한다.
// 아직 저장 전이라 서버 응답에는 dayId/itemId/pinned가 없다. 화면은 저장된 일정과
// 같은 Day[]로 다루므로 itineraryService가 서비스 경계에서 id를 합성해 채운다.
export interface RawGeneratedDay {
  dayIndex: number;
  items: RawGeneratedItem[];
}

export interface RawGeneratedItem {
  contentId: string;
  title: string;
  order: number;
  reason: string;
}

export interface RawItineraryGenerateResponse {
  title: string;
  region: Region;
  travelDate: string;
  duration: number;
  days: RawGeneratedDay[];
}

export interface ItineraryGenerateResponse {
  title: string;
  region: Region;
  travelDate: string;
  duration: number;
  days: Day[];
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
