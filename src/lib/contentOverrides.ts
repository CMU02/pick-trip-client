// 백엔드가 TourAPI에서 받아오는 대표 이미지가 음식이 잘 안 보이거나 부적절할 때
// 프론트에서 정적으로 교체한다. 백엔드 콘텐츠 동기화가 이 값을 덮어쓰지 않으므로
// contentId 기준으로 여기서 관리한다. contentService의 toContent/toContentDetail에서
// 적용되어 목록·상세·모든 카드에 반영된다.
//
// 2026-08-29 하동 음식점 대표 이미지 일괄 교체 (사용자 지정 URL).
export const CONTENT_IMAGE_OVERRIDES: Record<string, string> = {
  "2841685":
    "http://tong.visitkorea.or.kr/cms/resource/80/2841680_image2_1.JPG", // 고하버거 하동본점
  "2786098":
    "http://tong.visitkorea.or.kr/cms/resource/55/2792455_image2_1.JPG", // 꽃님 (돈까스)
  "2787999":
    "http://tong.visitkorea.or.kr/cms/resource/75/2790875_image2_1.jpg", // 늘봄식당
  "2868101":
    "http://tong.visitkorea.or.kr/cms/resource/98/2868098_image2_1.jpg", // 더로드101
  "791603": "http://tong.visitkorea.or.kr/cms/resource/48/3530848_image2_1.jpg", // 도심다원
  "2788002":
    "http://tong.visitkorea.or.kr/cms/resource/34/2790934_image2_1.jpg", // 만지횟집
  "2781622":
    "http://tong.visitkorea.or.kr/cms/resource/76/3549476_image2_1.jpg", // 매암제다원
  "2782730":
    "http://tong.visitkorea.or.kr/cms/resource/29/2788029_image2_1.jpg", // 버들횟집
  "2868110":
    "http://tong.visitkorea.or.kr/cms/resource/07/2868107_image2_1.jpg", // 벚굴식당
  "2788005":
    "http://tong.visitkorea.or.kr/cms/resource/02/2791002_image2_1.jpg", // 부두횟집
  // 브릿지130: 상세 대표 이미지(images[0])로 카드·상세를 통일한다.
  "2870730":
    "http://tong.visitkorea.or.kr/cms/resource/12/2870712_image2_1.jpg", // 브릿지130
  "2788011":
    "http://tong.visitkorea.or.kr/cms/resource/15/2790815_image2_1.jpg", // 삼성궁맛집 성남식당 (청학동)
  "2784765":
    "http://tong.visitkorea.or.kr/cms/resource/36/2787936_image2_1.jpg", // 섬진강식당
  "2788006":
    "http://tong.visitkorea.or.kr/cms/resource/91/2790791_image2_1.jpg", // 조양숯불갈비
  "2784643":
    "http://tong.visitkorea.or.kr/cms/resource/49/2784649_image2_1.jpg", // 청운식당
  "2788913":
    "http://tong.visitkorea.or.kr/cms/resource/22/2800222_image2_1.jpg", // 플래닛1020
  "1368910":
    "http://tong.visitkorea.or.kr/cms/resource/46/3547946_image2_1.jpg", // 하동솔잎한우프라자
  "3442627":
    "http://tong.visitkorea.or.kr/cms/resource/23/3442623_image2_1.jpg", // 티카페하동

  // 2026-08-29 영주 음식점 대표 이미지 일괄 교체 (사용자 지정 URL).
  "2605878":
    "http://tong.visitkorea.or.kr/cms/resource/66/2606366_image2_1.jpg", // 나드리
  "2821071":
    "http://tong.visitkorea.or.kr/cms/resource/58/2821058_image2_1.jpg", // 녹스고지
  "2841439":
    "http://tong.visitkorea.or.kr/cms/resource/21/2841421_image2_1.jpg", // 삼뜨락한정식
  "2841463":
    "http://tong.visitkorea.or.kr/cms/resource/61/2841461_image2_1.jpg", // 아테네레스토랑
  "2841479":
    "http://tong.visitkorea.or.kr/cms/resource/72/2841472_image2_1.jpg", // 영주축협한우프라자 본점
  // 카페, 선비꽃 → 선비꽃이야기: 상세 대표 이미지(images[0])로 카드·상세를 통일한다.
  "2832249":
    "http://tong.visitkorea.or.kr/cms/resource/33/2832233_image2_1.jpg", // 선비꽃이야기
  "2832268":
    "http://tong.visitkorea.or.kr/cms/resource/61/2832261_image2_1.jpg", // 태극당
  // 축산본점식육식당: 상세 대표 이미지(images[0])로 카드·상세를 통일한다.
  "2629725":
    "http://tong.visitkorea.or.kr/cms/resource/53/2630253_image2_1.jpg", // [백년가게]축산본점식육식당(축산회관)
};

// 백엔드 명칭이 길거나 옛 이름일 때 표시 이름을 교체한다.
export const CONTENT_TITLE_OVERRIDES: Record<string, string> = {
  "3442627": "티카페하동", // 백엔드: "하동야생차치유관 티카페하동"
  "2832249": "선비꽃이야기", // 백엔드: "카페, 선비꽃"
};

export function overrideContentName(id: string, name: string): string {
  return CONTENT_TITLE_OVERRIDES[id] ?? name;
}

export function overrideContentImage(
  id: string,
  imageUrl: string | null,
): string | null {
  return CONTENT_IMAGE_OVERRIDES[id] ?? imageUrl;
}
