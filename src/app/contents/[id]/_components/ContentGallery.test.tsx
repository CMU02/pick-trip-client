import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ContentGallery } from "./ContentGallery";

const imgs = [
  "https://example.com/1.jpg",
  "https://example.com/2.jpg",
  "https://example.com/3.jpg",
];

describe("ContentGallery", () => {
  it("사진이 한 장이면 화살표와 썸네일을 렌더하지 않는다", () => {
    render(
      <ContentGallery images={["https://example.com/1.jpg"]} name="쌍계사" />,
    );

    expect(
      screen.queryByRole("button", { name: "다음 사진" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "1번 사진 보기" }),
    ).not.toBeInTheDocument();
  });

  it("사진이 없으면 화살표를 렌더하지 않는다(폴백 히어로만)", () => {
    render(<ContentGallery images={[]} name="쌍계사" />);

    expect(
      screen.queryByRole("button", { name: "다음 사진" }),
    ).not.toBeInTheDocument();
  });

  it("여러 장이면 양옆 화살표와 1/N 카운터, 썸네일 버튼을 보여준다", () => {
    render(<ContentGallery images={imgs} name="쌍계사" />);

    expect(
      screen.getByRole("button", { name: "이전 사진" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "다음 사진" }),
    ).toBeInTheDocument();
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /번 사진 보기$/ }),
    ).toHaveLength(3);
  });

  it("다음 화살표를 누르면 다음 사진으로 넘어간다", async () => {
    render(<ContentGallery images={imgs} name="쌍계사" />);

    await userEvent.click(screen.getByRole("button", { name: "다음 사진" }));

    expect(screen.getByText("2 / 3")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "2번 사진 보기" }),
    ).toHaveAttribute("aria-current", "true");
  });

  it("첫 사진에서 이전을 누르면 마지막 사진으로 순환한다", async () => {
    render(<ContentGallery images={imgs} name="쌍계사" />);

    await userEvent.click(screen.getByRole("button", { name: "이전 사진" }));

    expect(screen.getByText("3 / 3")).toBeInTheDocument();
  });

  it("아래 썸네일을 클릭하면 그 사진으로 바뀐다", async () => {
    render(<ContentGallery images={imgs} name="쌍계사" />);

    await userEvent.click(
      screen.getByRole("button", { name: "3번 사진 보기" }),
    );

    expect(screen.getByText("3 / 3")).toBeInTheDocument();
  });
});
