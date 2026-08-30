"use client";

import { useEffect, useRef } from "react";

import { useKakaoMap } from "@/hooks/useKakaoMap";

interface ContentMapProps {
  latitude: number;
  longitude: number;
  // 마커 title(호버 툴팁)용. 좌표 유효성은 부모(ContentDetailView)가 판단해
  // 이 컴포넌트는 항상 유효한 좌표를 받는 전제로 동작한다.
  name: string;
}

// 코랄 원 + 흰 테두리 단일 마커. ItineraryMap.markerHtml 과 같은 방식(문자열
// content) 이지만 라벨 없이 점만 찍는다.
function markerHtml(title: string): string {
  const safe = title.replace(/"/g, "&quot;").replace(/</g, "&lt;");
  return `<div title="${safe}" style="width:18px;height:18px;border-radius:9999px;background:#F2542D;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>`;
}

const INITIAL_LEVEL = 4;

// 콘텐츠 한 곳을 보여주는 사이드 패널 지도. useKakaoMap + ItineraryMap 패턴
// (단일 effect 생성·ResizeObserver relayout·언마운트 정리)을 그대로 따른다.
// 컨테이너는 라운드 없이 250px 고정 — 감싸는 패널이 rounded-[20px] 를 갖는다.
export function ContentMap({ latitude, longitude, name }: ContentMapProps) {
  const { status } = useKakaoMap();
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const overlayRef = useRef<{
    setMap: (m: kakao.maps.Map | null) => void;
  } | null>(null);

  useEffect(() => {
    if (status !== "ready" || !boxRef.current) return;
    const kakaoNs = window.kakao?.maps;
    if (!kakaoNs) return;

    const center = new kakaoNs.LatLng(latitude, longitude);

    if (!mapRef.current) {
      mapRef.current = new kakaoNs.Map(boxRef.current, {
        center,
        level: INITIAL_LEVEL,
      });
    }
    const map = mapRef.current;
    map.setCenter(center);

    overlayRef.current?.setMap(null);
    const overlay = new kakaoNs.CustomOverlay({
      position: center,
      yAnchor: 0.5,
      content: markerHtml(name),
    });
    overlay.setMap(map);
    overlayRef.current = overlay;
  }, [latitude, longitude, name, status]);

  // 패널이 뒤늦게 보이거나(모바일→lg) 크기가 바뀌면 재배치(회색 타일 방지).
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const ro = new ResizeObserver(() => mapRef.current?.relayout());
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  // 언마운트 정리.
  useEffect(() => {
    return () => {
      overlayRef.current?.setMap(null);
      overlayRef.current = null;
      mapRef.current = null;
    };
  }, []);

  function zoom(delta: number) {
    const map = mapRef.current;
    if (!map) return;
    map.setLevel(map.getLevel() + delta);
  }

  return (
    <div
      data-testid="content-map"
      className="relative h-[250px] w-full overflow-hidden bg-muted"
    >
      <div ref={boxRef} className="h-full w-full" />

      {status === "ready" && (
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1">
          <button
            type="button"
            aria-label="지도 확대"
            onClick={() => zoom(-1)}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-md border border-border bg-white text-[17px] leading-none text-foreground"
          >
            +
          </button>
          <button
            type="button"
            aria-label="지도 축소"
            onClick={() => zoom(1)}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-md border border-border bg-white text-[17px] leading-none text-foreground"
          >
            −
          </button>
        </div>
      )}

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
    </div>
  );
}
