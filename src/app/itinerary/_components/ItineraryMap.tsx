"use client";

import { useEffect, useRef } from "react";

import { useKakaoMap } from "@/hooks/useKakaoMap";
import { haversineKm } from "@/lib/geo";
import {
  formatDistanceKm,
  formatTravelMinutes,
  sumRouteTravel,
} from "@/lib/itinerary";
import type { ItineraryMapDay } from "@/types/map";

// 일차별 마커/경로 색. overview(여러 날)에서 dayIndex(1-base) 기준으로 순환한다.
const DAY_COLORS = [
  "#F2542D",
  "#2D7DF2",
  "#12A150",
  "#8A2DF2",
  "#E8912D",
  "#E0338A",
];
// day 뷰는 한 날만 보여주므로 앱 코랄로 통일한다(oklch(0.6 0.19 28)).
// DayMapPanel의 지도 위 배지 점(dayColor)도 이 값을 그대로 쓴다.
export const CORAL = "#F2542D";

// 라벨을 앞 마커와 겹치지 않게 숨길 화면 거리(px). 시안과 동일.
const LABEL_COLLIDE_PX = 96;

interface ItineraryMapProps {
  // overview: 여행 전체(일차 색 구분) · day: 한 날만
  variant: "overview" | "day";
  days: ItineraryMapDay[];
  className?: string;
  // 지도 박스 높이를 호출부에서 지정한다(예: 사이드바 고정 지도 h-[300px]).
  // 없으면 variant 기본값.
  heightClassName?: string;
  // 카드 안에 flush로 박아 넣을 때(DayMapPanel): 박스 자체의 테두리·라운드를 뺀다.
  bare?: boolean;
  // 값이 바뀔 때마다(예: 확대/축소 토글의 boolean) 지도를 그 시점의 박스
  // 크기·현재 days에 맞춰 다시 자동 맞춤한다. 사용자가 드래그·휠로 지도를
  // 움직여놨어도, 이 값이 바뀌면 항상 "지금 보여줄 내용에 맞는" 화면으로
  // 복귀한다. 지정하지 않으면(대부분의 호출부) 아무 효과 없다.
  resetViewKey?: boolean;
}

function dayColor(dayIndex: number): string {
  return DAY_COLORS[(dayIndex - 1) % DAY_COLORS.length] ?? DAY_COLORS[0];
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// 번호 원 + (day 뷰) 장소명 라벨. 원은 오버레이 원점(= 지점 좌표)에 정확히
// 중심을 맞추고, 라벨은 원 오른쪽(flip이면 왼쪽)에 절대배치한다.
function markerHtml(
  n: string,
  color: string,
  title: string,
  opts: { size: number; label: boolean; flip: boolean },
): string {
  const half = opts.size / 2;
  const dot = `<div style="position:absolute;left:${-half}px;top:${-half}px;width:${opts.size}px;height:${opts.size}px;border-radius:9999px;background:${color};color:#fff;font-size:12px;font-weight:800;border:2.5px solid #fff;box-shadow:0 3px 8px rgba(48,20,12,.35);display:flex;align-items:center;justify-content:center">${escapeHtml(n)}</div>`;
  const side = opts.flip ? `right:${half + 6}px` : `left:${half + 6}px`;
  const labelHtml = opts.label
    ? `<div style="position:absolute;top:-9px;${side};max-width:132px;padding:3px 8px;border-radius:7px;background:rgba(255,255,255,.94);border:1px solid #e8e3e1;font-size:11px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(title)}</div>`
    : "";
  return `<div title="${escapeHtml(title)}" style="position:relative;width:0;height:0">${dot}${labelHtml}</div>`;
}

// days의 모든 지점이 들어오도록 지도를 맞춘다. 점이 하나뿐이면 bounds 대신
// 고정 레벨로 그 지점을 중심에 둔다. 호출 시점의 map 컨테이너 크기를
// 기준으로 매번 새로 계산하므로, 컨테이너 크기가 바뀐 뒤(예: 확대/축소
// 토글) 호출하면 그 크기에 맞는 구도가 나온다 — 이전에 다른 크기에서
// 계산해둔 값을 재사용하지 않는다.
function fitMapToDays(
  kakaoNs: typeof kakao.maps,
  map: kakao.maps.Map,
  days: ItineraryMapDay[],
): void {
  const bounds = new kakaoNs.LatLngBounds();
  let pointCount = 0;
  for (const day of days) {
    for (const p of day.points) bounds.extend(new kakaoNs.LatLng(p.lat, p.lng));
    pointCount += day.points.length;
  }
  if (pointCount === 1) {
    map.setLevel(5);
    map.setCenter(
      new kakaoNs.LatLng(days[0].points[0].lat, days[0].points[0].lng),
    );
  } else if (!bounds.isEmpty()) {
    map.setBounds(bounds, 40, 40, 40, 40);
  }
}

// 길찾기 결과가 없을 때 마커 사이 직선거리 합.
function straightLineKm(day: ItineraryMapDay): number {
  let sum = 0;
  for (let i = 0; i + 1 < day.points.length; i++) {
    sum += haversineKm(day.points[i], day.points[i + 1]);
  }
  return sum;
}

function caption(days: ItineraryMapDay[]): string | null {
  const routeTravel = sumRouteTravel(days);
  if (routeTravel) {
    const parts = [
      formatDistanceKm(routeTravel.km),
      formatTravelMinutes(routeTravel.minutes),
    ].filter(Boolean);
    return parts.length > 0 ? `이동 ${parts.join(" · ")}` : null;
  }
  const km = days.reduce((s, d) => s + straightLineKm(d), 0);
  const label = formatDistanceKm(km);
  return label ? `직선거리 약 ${label}` : null;
}

// day.points 각각의 컨테이너 픽셀 좌표를 구해, 라벨을 (1) 지도 우측이면 왼쪽으로
// 뒤집고 (2) 앞 마커와 LABEL_COLLIDE_PX 이내면 숨긴다. 지도 투영을 못 얻으면
// 라벨은 전부 표시하고 뒤집지 않는다(안전한 기본값).
function labelLayout(
  kakaoNs: typeof kakao.maps,
  map: kakao.maps.Map,
  box: HTMLElement,
  day: ItineraryMapDay,
): { flip: boolean; label: boolean }[] {
  const fallback = day.points.map(() => ({ flip: false, label: true }));
  const width = box.clientWidth || 0;
  const pts: { x: number; y: number }[] = [];
  try {
    const projection = map.getProjection();
    if (!projection) return fallback;
    for (const p of day.points) {
      const pt = projection.containerPointFromCoords(
        new kakaoNs.LatLng(p.lat, p.lng),
      );
      pts.push({ x: pt.x, y: pt.y });
    }
  } catch {
    return fallback;
  }
  return pts.map((pt, i) => {
    const flip = width > 0 && pt.x > width * 0.55;
    let label = true;
    for (let j = 0; j < i; j++) {
      const dx = pt.x - pts[j].x;
      const dy = pt.y - pts[j].y;
      if (Math.sqrt(dx * dx + dy * dy) < LABEL_COLLIDE_PX) label = false;
    }
    return { flip, label };
  });
}

export function ItineraryMap({
  variant,
  days,
  className,
  heightClassName,
  bare = false,
  resetViewKey,
}: ItineraryMapProps) {
  const { status } = useKakaoMap();
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const overlaysRef = useRef<{ setMap: (m: kakao.maps.Map | null) => void }[]>(
    [],
  );
  // days가 실제로 같은 장소들이어도(호출부가 매번 새 배열/객체를 넘기는
  // 경우가 있다 — 예: 스냅샷 없이 라이브로 좌표를 해석하는 useItineraryMapData)
  // 참조만 바뀐 리렌더로 메인 이펙트가 다시 돌 때마다 "고정 구도"가 그
  // 순간의 박스 크기 기준으로 덮어써지는 걸 막는다. 좌표 내용을 직렬화해
  // 실제로 달라졌을 때만(예: 다른 일차 선택) 새로 캡처한다.
  const fixedViewContentRef = useRef<string | null>(null);

  useEffect(() => {
    if (status !== "ready" || !boxRef.current) return;
    const kakaoNs = window.kakao?.maps;
    if (!kakaoNs) return;

    if (!mapRef.current) {
      mapRef.current = new kakaoNs.Map(boxRef.current, {
        center: new kakaoNs.LatLng(36.5, 127.9),
        level: variant === "overview" ? 9 : 6,
      });
    }
    const map = mapRef.current;

    for (const o of overlaysRef.current) o.setMap(null);
    overlaysRef.current = [];

    // 폴리라인 먼저 그린다(마커가 위로 오도록).
    for (const day of days) {
      const color = variant === "day" ? CORAL : dayColor(day.dayIndex);
      const linePath = day.route
        ? day.route.path.map(([lng, lat]) => new kakaoNs.LatLng(lat, lng))
        : day.points.map((p) => new kakaoNs.LatLng(p.lat, p.lng));

      if (linePath.length >= 2) {
        const line = new kakaoNs.Polyline({
          path: linePath,
          strokeWeight: variant === "day" ? 5 : 4,
          strokeColor: color,
          strokeOpacity: 0.9,
          strokeStyle: day.route ? "solid" : "shortdash",
        });
        line.setMap(map);
        overlaysRef.current.push(line);
      }
    }

    // 지도 프레이밍(bounds)에 실제로 영향을 주는 내용만 시그니처로 삼는다
    // (points의 dayIndex·좌표 — route는 선 모양만 바꾸고 fit에는 안 쓰인다).
    // 호출부가 매번 새 배열/객체를 넘겨도(스냅샷 없이 라이브로 좌표를
    // 해석하는 useItineraryMapData처럼) 내용이 같으면 지도 자동 fit을
    // 건너뛴다 — 안 그러면 사용자가 지도를 보고 있는 동안에도 매
    // 리렌더마다 뷰가 다시 스냅돼 버린다.
    const contentSignature = JSON.stringify(
      days.map((d) => [d.dayIndex, d.points.map((p) => [p.lat, p.lng])]),
    );
    if (fixedViewContentRef.current !== contentSignature) {
      fixedViewContentRef.current = contentSignature;
      fitMapToDays(kakaoNs, map, days);
    }

    // 마커: bounds 반영 후 투영으로 라벨 레이아웃을 계산한다.
    for (const day of days) {
      const color = variant === "day" ? CORAL : dayColor(day.dayIndex);
      const layout =
        variant === "day" && boxRef.current
          ? labelLayout(kakaoNs, map, boxRef.current, day)
          : day.points.map(() => ({ flip: false, label: false }));

      day.points.forEach((p, i) => {
        const pos = new kakaoNs.LatLng(p.lat, p.lng);
        const n =
          variant === "overview" ? `${day.dayIndex}-${i + 1}` : `${i + 1}`;
        const overlay = new kakaoNs.CustomOverlay({
          position: pos,
          xAnchor: 0,
          yAnchor: 0,
          zIndex: 3,
          content: markerHtml(n, color, p.title, {
            size: variant === "day" ? 26 : 22,
            label: layout[i]?.label ?? false,
            flip: layout[i]?.flip ?? false,
          }),
        });
        overlay.setMap(map);
        overlaysRef.current.push(overlay);
      });
    }
  }, [days, variant, status]);

  // 컨테이너가 뒤늦게 보이거나 크기가 바뀌면 재배치한다(회색 타일 방지).
  // 중심·레벨은 여기서 다시 맞추지 않는다 — 리사이즈 중(예: 확대/축소 CSS
  // 전환) 매 틱마다 bounds를 다시 맞추면, 박스 모양이 바뀔 때마다 카카오가
  // 고르는 줌 레벨도 같이 바뀌어 접힌 상태와 확대 상태의 배율이 서로 달라
  // 보이는 문제가 있었다. 대신 아래 resetViewKey 이펙트가 토글 시점에 한
  // 번, 고정된 값으로 되돌린다.
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const ro = new ResizeObserver(() => mapRef.current?.relayout());
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  // 확대/축소 토글마다(resetViewKey가 바뀔 때) 지도를 그 순간의 박스
  // 크기·현재 선택된 days 기준으로 다시 자동 맞춤한다. 사용자가 그 사이
  // 드래그·휠로 지도를 움직여놨어도, 또는 확대 상태에서 다른 일차로
  // 바꾼 뒤 축소했어도 항상 "지금 보여줄 내용에 맞는" 화면으로 복귀한다.
  // 예전에는 최초 자동 맞춤 당시의 중심·레벨을 스냅샷으로 저장해뒀다가
  // 그대로 재생했는데, 확대 상태에서 day를 바꾸면 그 스냅샷이 넓은 박스
  // 기준으로 덮어써져 축소 시 좁은 박스에 잘못 적용되는 문제가 있었다.
  // days는 의존성에 넣지 않는다 — day 전환만으로는 재실행하지 않고
  // resetViewKey 값 자체가 바뀔 때만(토글 시점) 동작해야 한다. 실행될
  // 때는 그 렌더의 클로저가 잡고 있는 최신 days를 그대로 쓰므로, 그
  // 사이 day가 바뀌었어도 항상 지금 선택된 day 기준으로 다시 맞춘다.
  // biome-ignore lint/correctness/useExhaustiveDependencies: days는 의도적으로 제외 — 위 주석 참고
  useEffect(() => {
    if (resetViewKey === undefined) return;
    const map = mapRef.current;
    const kakaoNs = window.kakao?.maps;
    if (!map || !kakaoNs) return;
    // relayout()을 먼저 불러 컨테이너의 "지금" 크기를 반영시킨 다음
    // fit해야 한다 — 순서를 반대로 하면 relayout이 그 직후 옛 컨테이너
    // 크기 기준으로 다시 계산해버린다.
    map.relayout();
    fitMapToDays(kakaoNs, map, days);
  }, [resetViewKey]);

  useEffect(() => {
    return () => {
      for (const o of overlaysRef.current) o.setMap(null);
      overlaysRef.current = [];
      mapRef.current = null;
    };
  }, []);

  const hasAnyPoint = days.some((d) => d.points.length > 0);
  const boxHeight =
    heightClassName ?? (variant === "overview" ? "h-[360px]" : "h-[220px]");
  const chrome = bare
    ? ""
    : `border border-border ${variant === "overview" ? "rounded-2xl" : "rounded-xl"}`;
  const captionText =
    variant === "overview" && hasAnyPoint ? caption(days) : null;

  return (
    <div className={className}>
      <div
        className={`relative w-full overflow-hidden bg-muted ${boxHeight} ${chrome}`}
      >
        <div ref={boxRef} className="h-full w-full" />
        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
            지도를 불러오는 중…
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-xs text-muted-foreground">
            지도를 불러오지 못했어요
          </div>
        )}
        {status === "ready" && !hasAnyPoint && (
          <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-xs text-muted-foreground">
            위치 정보가 있는 장소가 없어요
          </div>
        )}
      </div>
      {captionText && (
        <p className="mt-1.5 text-[12px] text-muted-foreground">
          {captionText}
        </p>
      )}
    </div>
  );
}
