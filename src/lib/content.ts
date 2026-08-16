import { parseApiError } from "@/lib/errors";
import {
  CATEGORY_LABELS,
  CONTENT_CATEGORIES,
  type Content,
} from "@/types/content";

export interface ContentGroup {
  key: string;
  label: string;
  items: Content[];
}

const UNCATEGORIZED_LABEL = "기타";

// CONTENT_CATEGORIES 순서대로 묶고, category가 없는 콘텐츠는 마지막에 "기타"로 모은다.
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
