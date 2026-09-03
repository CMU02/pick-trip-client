import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdjustmentsNotice } from "./AdjustmentsNotice";

describe("AdjustmentsNotice", () => {
  it("조정 항목을 모두 렌더한다", () => {
    render(
      <AdjustmentsNotice
        adjustments={[
          "'쌍계사'는 1일차(수) 휴무여서 2일차로 옮겼습니다.",
          "점심 시간에 맞춰 '화개장터'를 앞으로 당겼습니다.",
        ]}
      />,
    );

    expect(
      screen.getByText("AI가 일정을 이렇게 조정했어요"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("'쌍계사'는 1일차(수) 휴무여서 2일차로 옮겼습니다."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("점심 시간에 맞춰 '화개장터'를 앞으로 당겼습니다."),
    ).toBeInTheDocument();
  });

  it("항목이 비면 아무것도 렌더하지 않는다", () => {
    const { container } = render(<AdjustmentsNotice adjustments={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
