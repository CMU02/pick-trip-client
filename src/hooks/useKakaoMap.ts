"use client";

import { useEffect, useState } from "react";

import { loadKakaoMaps } from "@/lib/kakaoMapLoader";

type KakaoMapStatus = "loading" | "ready" | "error";

// Kakao Maps SDK 로드 상태를 구독하는 훅. 여러 지도 컴포넌트가 동시에 써도
// loadKakaoMaps 싱글턴 덕분에 SDK 는 한 번만 로드된다.
export function useKakaoMap(): { status: KakaoMapStatus } {
  const [status, setStatus] = useState<KakaoMapStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    loadKakaoMaps()
      .then(() => {
        if (!cancelled) setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { status };
}
