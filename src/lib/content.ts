import { parseApiError } from "@/lib/errors";
import {
  CATEGORY_LABELS,
  CONTENT_CATEGORIES,
  type Content,
  type ContentCategory,
} from "@/types/content";

// 콘텐츠 목록을 한 번에 얼마씩 불러올지. 서버 컴포넌트의 초기 fetch와
// useLoadMoreContents(클라이언트 "더보기")가 같은 값을 쓴다.
export const CONTENT_PAGE_SIZE = 20;

// 백엔드가 TourAPI 원문을 그대로 내려주는 운영시간·휴무일 등 자유 텍스트에는
// 리터럴 <br> 태그가 섞여 온다. 실제 줄바꿈으로 나눠 각 줄을 렌더한다
// (dangerouslySetInnerHTML을 쓰지 않기 위해 문자열 배열로 반환).
export function splitBrLines(text: string): string[] {
  return text
    .split(/<br\s*\/?>/i)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

// /api/v1/contents는 지역마다 같은 size로 fan-out 해서 응답을 합친다
// (contentService.getContents 참고). 지역을 여러 개 한꺼번에 조회할 때
// 모든 지역에 size를 그대로 주면 한 번에 size × 지역 수개가 온다 — "전체"
// 탭에서 더보기 한 번에 60개(20개 × 3지역)가 늘어나던 원인이 이거다.
// size를 지역별로 쪼개(나머지는 앞 지역부터 1씩) 합계가 정확히 size가 되게
// 한다. 예: size 20, 3지역 → [7, 7, 6]. 지역이 1개면 [size] 그대로.
export function splitPageSizeAcrossRegions(
  size: number,
  regionCount: number,
): number[] {
  if (regionCount <= 0) return [];
  const base = Math.floor(size / regionCount);
  const remainder = size % regionCount;
  return Array.from({ length: regionCount }, (_, i) =>
    Math.max(1, base + (i < remainder ? 1 : 0)),
  );
}

export interface ContentGroup {
  key: string;
  label: string;
  items: Content[];
}

const UNCATEGORIZED_LABEL = "기타";

// CONTENT_CATEGORY_ORDER대로 묶고, category가 없는 콘텐츠는 마지막에 "기타"로 모은다.
export function groupContentsByCategory(contents: Content[]): ContentGroup[] {
  const groups: ContentGroup[] = CONTENT_CATEGORIES.map((category) => ({
    key: category,
    label: CATEGORY_LABELS[category],
    items: contents.filter((c) => c.category === category),
  })).filter((group) => group.items.length > 0);

  const uncategorized = contents.filter((c) => c.category === undefined);
  if (uncategorized.length > 0) {
    groups.push({
      key: "uncategorized",
      label: UNCATEGORIZED_LABEL,
      items: uncategorized,
    });
  }

  return groups;
}

// 여러 카테고리를 동시에 선택했을 때 화면에서 뒤섞이지 않도록,
// CONTENT_CATEGORY_ORDER대로 정렬한다(같은 카테고리 안에서는 원래 순서를
// 유지하는 안정 정렬). category가 없는 항목은 맨 뒤로 보낸다.
export function sortContentsByCategory(contents: Content[]): Content[] {
  return [...contents].sort(
    (a, b) => categoryOrderIndex(a.category) - categoryOrderIndex(b.category),
  );
}

function categoryOrderIndex(category: ContentCategory | undefined): number {
  if (category === undefined) return CONTENT_CATEGORIES.length;
  const index = CONTENT_CATEGORIES.indexOf(category);
  return index === -1 ? CONTENT_CATEGORIES.length : index;
}

// 백엔드가 TourAPI(공공데이터포털) 호출에 실패하면 502 CONTENT_PROVIDER_FAILED로
// 응답한다. 콘텐츠가 실제로 없는 게 아니라 외부 제공자 쪽 일시적인 문제이므로,
// "콘텐츠가 없습니다" 대신 다시 시도해볼 만하다는 걸 알 수 있게 문구를 구분한다.
// 그 외 오류는 서버/네트워크가 알려준 실제 메시지를 그대로 보여준다.
export function getContentFetchErrorMessage(err: unknown): string {
  const { code, message } = parseApiError(err);
  if (code === "CONTENT_PROVIDER_FAILED") {
    return "일시적인 오류로 콘텐츠를 불러오지 못했어요. 잠시 후 다시 시도해주세요.";
  }
  return message;
}

// 주어진 id 목록에 속한 콘텐츠만, id 목록의 순서 그대로 남긴다. 컬렉션
// (테마 묶음)이 /explore?ids= 로 넘겨준 순서를 화면에서도 유지하기 위한 것.
// ids가 비면 필터하지 않고 원본을 그대로 돌려준다. 목록에 없는 id는 무시한다.
export function filterContentsByIds(
  contents: Content[],
  ids: string[],
): Content[] {
  if (ids.length === 0) return contents;
  const byId = new Map(contents.map((c) => [c.id, c]));
  const result: Content[] = [];
  for (const id of ids) {
    const found = byId.get(id);
    if (found) result.push(found);
  }
  return result;
}

// 여러 페이지를 이어붙일 때 같은 콘텐츠가 중복되지 않게 id 기준으로 거른다.
// 먼저 온 항목을 유지한다.
export function mergeUniqueContents(contents: Content[]): Content[] {
  const seen = new Set<string>();
  const result: Content[] = [];
  for (const content of contents) {
    if (seen.has(content.id)) continue;
    seen.add(content.id);
    result.push(content);
  }
  return result;
}
