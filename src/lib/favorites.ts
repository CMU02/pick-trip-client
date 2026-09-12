import type { Content } from "@/types/content";

// 찜 목록을 "최근에 찜한 순"으로 정렬한다. /favorites와 마이페이지 찜
// 미리보기가 함께 쓴다.
//
// 예전에는 "서버 응답이 찜한 순서(오래된 게 먼저)로 온다"는 가정 아래
// [...items].reverse()로 최신순을 흉내 냈다. 지금 items는 GET
// /api/v1/favorites 응답을 그대로 옮긴 것이라 서버 정렬이 바뀌면(또는
// 애초에 그 가정이 맞지 않으면) 조용히 순서가 어긋난다. 응답에 이미
// 있는 createdAt으로 명시적으로 정렬해, 서버가 어떤 순서로 내려주든
// 결과가 같다.
//
// 방금 낙관적으로 추가된 항목(useFavorites의 onMutate)은 서버 응답을
// 아직 못 받아 createdAt이 없다 — 그 경우 "지금 막 찜한 것"으로 보고
// 맨 앞에 오게 한다.
export function sortByRecentlyFavorited(items: Content[]): Content[] {
  const time = (content: Content) => {
    const parsed = content.createdAt ? Date.parse(content.createdAt) : NaN;
    return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
  };
  return [...items].sort((a, b) => time(b) - time(a));
}
