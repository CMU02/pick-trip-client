"use client";

import { useEffect, useRef } from "react";

import { useKakaoMap } from "@/hooks/useKakaoMap";
import { haversineKm } from "@/lib/geo";
import { formatDistanceKm, formatTravelMinutes } from "@/lib/itinerary";
import type { ItineraryMapDay } from "@/types/map";

// 일차별 마커/경로 색. dayIndex(1-base) 기준으로 순환한다.
const DAY_COLORS = [
  "#F2542D",
  "#2D7DF2",
  "#12A150",
  "#8A2DF2",
  "#E8912D",
  "#E0338A",
];

interface ItineraryMapProps {
  // overview: 여행 전체(일차 색 구분) · day: 한 날만
  variant: "overview" | "day";
  days: ItineraryMapDay[];
  className?: string;
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

function markerHtml(label: string, color: string, title: string): string {
  return `<div title="${escapeHtml(title)}" style="transform:translateY(-50%);display:flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:9999px;background:${color};color:#fff;font-size:11px;font-weight:800;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3)">${escapeHtml(label)}</div>`;
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
  const withRoute = days.filter((d) => d.route);
  if (withRoute.length > 0) {
    const km = withRoute.reduce(
      (s, d) => s + (d.route?.totalDistanceMeters ?? 0) / 1000,
      0,
    );
    const min = withRoute.reduce(
      (s, d) => s + Math.round((d.route?.totalDurationSeconds ?? 0) / 60),
      0,
    );
    const parts = [formatDistanceKm(km), formatTravelMinutes(min)].filter(
      Boolean,
    );
    return parts.length > 0 ? `이동 ${parts.join(" · ")}` : null;
  }
  const km = days.reduce((s, d) => s + straightLineKm(d), 0);
  const label = formatDistanceKm(km);
  return label ? `직선거리 약 ${label}` : null;
}

export function ItineraryMap({ variant, days, className }: ItineraryMapProps) {
  const { status } = useKakaoMap();
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const overlaysRef = useRef<{ setMap: (m: kakao.maps.Map | null) => void }[]>(
    [],
  );

  // 지도 생성(1회) + 데이터 동기화. mapRef 는 리액티브 의존성이 아니라
  // 생성/그리기를 한 effect 로 묶어야 status 변화(로딩→ready)에 함께 반응한다.
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

    const bounds = new kakaoNs.LatLngBounds();
    let pointCount = 0;

    for (const day of days) {
      const color = dayColor(day.dayIndex);
      const linePath = day.route
        ? day.route.path.map(([lng, lat]) => new kakaoNs.LatLng(lat, lng))
        : day.points.map((p) => new kakaoNs.LatLng(p.lat, p.lng));

      if (linePath.length >= 2) {
        const line = new kakaoNs.Polyline({
          path: linePath,
          strokeWeight: 4,
          strokeColor: color,
          strokeOpacity: 0.9,
          strokeStyle: day.route ? "solid" : "shortdash",
        });
        line.setMap(map);
        overlaysRef.current.push(line);
      }

      day.points.forEach((p, i) => {
        const pos = new kakaoNs.LatLng(p.lat, p.lng);
        bounds.extend(pos);
        pointCount += 1;
        const label =
          variant === "overview" ? `${day.dayIndex}-${i + 1}` : `${i + 1}`;
        const overlay = new kakaoNs.CustomOverlay({
          position: pos,
          yAnchor: 1,
          zIndex: 3,
          content: markerHtml(label, color, p.title),
        });
        overlay.setMap(map);
        overlaysRef.current.push(overlay);
      });
    }

    if (pointCount === 1) {
      map.setLevel(5);
      map.setCenter(
        new kakaoNs.LatLng(days[0].points[0].lat, days[0].points[0].lng),
      );
    } else if (!bounds.isEmpty()) {
      map.setBounds(bounds, 40, 40, 40, 40);
    }
  }, [days, variant, status]);

  // 컨테이너가 뒤늦게 보이거나 크기가 바뀌면 재배치(회색 타일 방지)
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const ro = new ResizeObserver(() => mapRef.current?.relayout());
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  // 언마운트 정리
  useEffect(() => {
    return () => {
      for (const o of overlaysRef.current) o.setMap(null);
      overlaysRef.current = [];
      mapRef.current = null;
    };
  }, []);

  const hasAnyPoint = days.some((d) => d.points.length > 0);
  const boxHeight = variant === "overview" ? "h-[360px]" : "h-[220px]";
  const radius = variant === "overview" ? "rounded-2xl" : "rounded-xl";
  const captionText = hasAnyPoint ? caption(days) : null;

  return (
    <div className={className}>
      <div
        className={`relative w-full overflow-hidden border border-border bg-muted ${boxHeight} ${radius}`}
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
