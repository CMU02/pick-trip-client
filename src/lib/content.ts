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
