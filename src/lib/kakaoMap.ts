// Kakao Maps JS SDK appkey. 브라우저에 그대로 노출되는 값이며(도메인 제한은
// Kakao 개발자 콘솔에서 건다), 서버 전용 길찾기 REST 키(KAKAO_REST_API_KEY)와는
// 다른 키다. SDK가 브라우저에서 로드되므로 NEXT_PUBLIC_ 접두사가 필수다.
export const KAKAO_JS_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY ?? "";
