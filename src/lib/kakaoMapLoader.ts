import {
  KAKAO_JS_KEY,
  KAKAO_MAPS_SDK_SRC,
  KAKAO_MAPS_SDK_SRC_PREFIX,
} from "./kakaoMap";

// Kakao Maps SDK 를 한 번만 로드하는 모듈 싱글턴. 한 화면에 지도 인스턴스가
// 여러 개(전체 지도 + 일차별 지도)라 로드를 공유해야 한다. next/script 대신
// 이 방식을 쓰는 이유는 계획 문서(docs/plan/itinerary-map.md) 참고.
const SCRIPT_ID = "kakao-maps-sdk";

// sdk.js 는 200 으로 실행됐는데 SDK 가 내부적으로 받는 본체(kakao.js)가
// 끝나지 않으면 kakao.maps.load 콜백이 영원히 오지 않는다. 그때 스크립트
// 태그에는 error 이벤트가 뜨지 않으므로, 상한을 두지 않으면 프라미스가
// resolve 도 reject 도 되지 않아 화면이 "지도를 불러오는 중…"에 영구히
// 머문다. 상한을 넘기면 error 상태로 보내 안내 문구라도 뜨게 한다.
const LOAD_TIMEOUT_MS = 12_000;

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

    let settled = false;
    const timer = window.setTimeout(() => {
      // 다음 시도가 새로 받을 수 있도록 버린다.
      settle(new Error("Kakao Maps SDK load timed out"));
    }, LOAD_TIMEOUT_MS);

    function settle(error?: Error) {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      if (!error) {
        resolve();
        return;
      }
      loadPromise = null;
      reject(error);
    }

    // autoload=false 로 받았으므로 kakao.maps.load 로 실제 초기화를 트리거한다.
    const ready = () => {
      const maps = window.kakao?.maps;
      if (maps) maps.load(() => settle());
      else settle(new Error("Kakao Maps SDK loaded without window.kakao.maps"));
    };

    if (window.kakao?.maps) {
      ready();
      return;
    }

    // warmKakaoMaps 의 preinit 이 SSR HTML 에 먼저 끼워 넣은 스크립트가 있으면
    // 그걸 기다린다. preinit 이 만든 태그에는 우리 id 가 없으므로 src 로 찾는다.
    let script = document.querySelector<HTMLScriptElement>(
      `script[src^="${KAKAO_MAPS_SDK_SRC_PREFIX}"]`,
    );

    if (!script) {
      script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.async = true;
      script.src = KAKAO_MAPS_SDK_SRC;
      document.head.appendChild(script);
    }

    const sdkScript = script;
    sdkScript.addEventListener("load", ready, { once: true });
    sdkScript.addEventListener(
      "error",
      () => {
        // 다음 시도가 새로 붙일 수 있도록 실패한 스크립트는 버린다.
        sdkScript.remove();
        settle(new Error("Kakao Maps SDK failed to load"));
      },
      { once: true },
    );
  });

  return loadPromise;
}
