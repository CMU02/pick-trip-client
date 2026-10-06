// Kakao Maps JS SDK appkey. 브라우저에 그대로 노출되는 값이며(도메인 제한은
// Kakao 개발자 콘솔에서 건다), 서버 전용 길찾기 REST 키(KAKAO_REST_API_KEY)와는
// 다른 키다. SDK가 브라우저에서 로드되므로 NEXT_PUBLIC_ 접두사가 필수다.
export const KAKAO_JS_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY ?? "";

// SDK 로더(sdk.js)를 받는 호스트.
export const KAKAO_MAPS_SDK_ORIGIN = "https://dapi.kakao.com";

// sdk.js가 실행된 뒤 SDK가 내부적으로 본체(mapjsapi/.../kakao.js)와 지도
// 리소스를 받아 오는 CDN. sdk.js와 다른 호스트라 콜드 커넥션이 한 번 더
// 필요하므로, 지도를 쓰는 라우트에서는 미리 커넥션을 열어 둔다.
export const KAKAO_MAPS_CDN_ORIGIN = "https://t1.kakaocdn.net";

// 쿼리스트링을 뺀 sdk.js URL. 문서에 이미 붙어 있는 SDK 스크립트를 appkey와
// 무관하게 찾아내는 데 쓴다.
export const KAKAO_MAPS_SDK_SRC_PREFIX = `${KAKAO_MAPS_SDK_ORIGIN}/v2/maps/sdk.js`;

// autoload=false: 스크립트 실행과 SDK 초기화를 분리해 kakao.maps.load로
// 초기화 시점을 직접 제어한다.
export const KAKAO_MAPS_SDK_SRC = `${KAKAO_MAPS_SDK_SRC_PREFIX}?appkey=${KAKAO_JS_KEY}&autoload=false`;
