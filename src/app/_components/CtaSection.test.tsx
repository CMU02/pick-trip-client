import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CtaSection } from "./CtaSection";

describe("CtaSection", () => {
  it("콘텐츠 탐색/AI일정으로 이동하는 CTA 링크를 보여준다", () => {
    render(<CtaSection />);

    expect(
      screen.getByRole("link", { name: "콘텐츠부터 골라보기" }),
    ).toHaveAttribute("href", "/contents?regions=HADONG,YEONGJU,YECHEON");
    expect(
      screen.getByRole("link", { name: "AI 일정으로 바로가기" }),
    ).toHaveAttribute(
      "href",
      "/select/conditions?regions=HADONG,YEONGJU,YECHEON",
    );
  });
});
