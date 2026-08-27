import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ContentImageFallback } from "./ContentImageFallback";

// 렌더된 SVG의 모든 path d 속성을 한 문자열로 이어붙인다. 카테고리별
// 아이콘은 각자 고유한 path 좌표를 갖고 있어 어떤 아이콘이 그려졌는지
// 이 문자열로 구분할 수 있다.
function iconPaths(container: HTMLElement) {
  return [...container.querySelectorAll("path")]
    .map((p) => p.getAttribute("d") ?? "")
    .join(" ");
}

// restaurant-outline(음식) / compass-outline(관광지·폴백)의 고유 좌표
const FOOD_MARKER = "M57.49,47.74";
const ATTRACTION_MARKER = "M448,256c0-106";

describe("ContentImageFallback", () => {
  it("category가 FOOD이면 음식 아이콘을 렌더한다", () => {
    const { container } = render(<ContentImageFallback category="FOOD" />);
    expect(iconPaths(container)).toContain(FOOD_MARKER);
  });

  it("category가 null이면 관광지(compass) 아이콘으로 폴백한다", () => {
    const { container } = render(<ContentImageFallback category={null} />);
    const paths = iconPaths(container);
    expect(paths).toContain(ATTRACTION_MARKER);
    expect(paths).not.toContain(FOOD_MARKER);
  });

  it("size가 sm이면 원형 타일(rounded-full)을 그리지 않는다", () => {
    const { container } = render(
      <ContentImageFallback category="FOOD" size="sm" />,
    );
    expect(container.querySelector(".rounded-full")).toBeNull();
  });

  it("size가 lg이면 원형 타일(rounded-full)을 그린다", () => {
    const { container } = render(
      <ContentImageFallback category="FOOD" size="lg" />,
    );
    expect(container.querySelector(".rounded-full")).not.toBeNull();
  });

  it("플레이스홀더는 aria-hidden이라 접근성 트리에서 제외된다", () => {
    const { container } = render(<ContentImageFallback category="FOOD" />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden");
  });
});
