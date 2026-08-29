// Kakao Maps JS SDK appkey. 브라우저에 그대로 노출되는 값이며(도메인 제한은
// Kakao 개발자 콘솔에서 건다), 서버 전용 길찾기 REST 키(KAKAO_REST_API_KEY)와는
// 다른 키다. src/lib/site.ts 와 같은 "환경변수 → const" 패턴.
export const KAKAO_MAP_JS_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY ?? "";
