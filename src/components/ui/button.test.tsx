import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";

const BUTTON_SIZES = [
  "default",
  "xs",
  "sm",
  "lg",
  "icon",
  "icon-xs",
  "icon-sm",
  "icon-lg",
] as const;

describe("Button", () => {
  it("자식 텍스트를 버튼으로 렌더링한다", () => {
    render(<Button>일정 만들기</Button>);

    expect(
      screen.getByRole("button", { name: "일정 만들기" }),
    ).toBeInTheDocument();
  });

  it("variant와 size를 data 속성으로 반영한다", () => {
    render(
      <Button variant="outline" size="sm">
        취소
      </Button>,
    );

    const button = screen.getByRole("button", { name: "취소" });
    expect(button).toHaveAttribute("data-variant", "outline");
    expect(button).toHaveAttribute("data-size", "sm");
  });

  // jsdom은 레이아웃을 계산하지 않아 실제 픽셀 크기는 검증할 수 없다.
  // 여기서는 모든 size 변형이 최소 크기 클래스를 잃지 않는지만 지킨다.
  it.each(
    BUTTON_SIZES,
  )("size=%s에도 최소 44x44 크기 클래스가 남는다", (size) => {
    render(<Button size={size}>담기</Button>);

    expect(screen.getByRole("button", { name: "담기" })).toHaveClass(
      "min-h-11",
      "min-w-11",
    );
  });

  it("asChild로 다른 요소에 버튼 스타일을 위임한다", () => {
    render(
      <Button asChild>
        <a href="/contents">콘텐츠 보기</a>
      </Button>,
    );

    const link = screen.getByRole("link", { name: "콘텐츠 보기" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/contents");
  });
});
