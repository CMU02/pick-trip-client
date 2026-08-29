import { KAKAO_JS_KEY } from "./kakaoMap";

// Kakao Maps SDK 를 한 번만 로드하는 모듈 싱글턴. 한 화면에 지도 인스턴스가
// 여러 개(전체 지도 + 일차별 지도)라 로드를 공유해야 한다. next/script 대신
// 이 방식을 쓰는 이유는 계획 문서(docs/plan/itinerary-map.md) 참고.
const SCRIPT_ID = "kakao-maps-sdk";

let loadPromise: Promise<void> | null = null;

export function loadKakaoMaps(): Promise<void> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("loadKakaoMaps must run in the browser"));
      return;
    }
    if (!KAKAO_JS_KEY) {
      reject(new Error("NEXT_PUBLIC_KAKAO_JS_KEY is not set"));
      return;
    }

    // autoload=false 로 받았으므로 kakao.maps.load 로 실제 초기화를 트리거한다.
    const ready = () => {
      const maps = window.kakao?.maps;
      if (maps) maps.load(() => resolve());
      else reject(new Error("Kakao Maps SDK loaded without window.kakao.maps"));
    };

    if (window.kakao?.maps) {
      ready();
      return;
    }

    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.async = true;
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false`;
      document.head.appendChild(script);
    }

    script.addEventListener("load", ready, { once: true });
    script.addEventListener(
      "error",
      () => {
        // 다음 시도가 새로 붙일 수 있도록 실패한 프라미스는 버린다.
        loadPromise = null;
        script?.remove();
        reject(new Error("Kakao Maps SDK failed to load"));
      },
      { once: true },
    );
  });

  return loadPromise;
}
