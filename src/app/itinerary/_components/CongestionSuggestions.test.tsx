import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ItinerarySuggestion } from "@/types/itinerary";
import { CongestionSuggestions, suggestionKey } from "./CongestionSuggestions";

function makeSuggestion(
  overrides: Partial<ItinerarySuggestion> = {},
): ItinerarySuggestion {
  return {
    type: "CONGESTION_REORDER",
    message: "'화개장터'는 지금 시간대가 붐벼요. '쌍계사'를 먼저 가보세요.",
    dayIndex: 1,
    contentId: "content-2",
    swapWithContentId: "content-1",
    ...overrides,
  };
}

describe("CongestionSuggestions", () => {
  it("제안이 없으면 아무것도 렌더하지 않는다", () => {
    const { container } = render(
      <CongestionSuggestions
        suggestions={[]}
        acceptedKeys={new Set()}
        onAccept={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("제안 문구와 '순서 바꾸기' 버튼을 보여준다", () => {
    render(
      <CongestionSuggestions
        suggestions={[makeSuggestion()]}
        acceptedKeys={new Set()}
        onAccept={vi.fn()}
      />,
    );

    expect(
      screen.getByText(
        "'화개장터'는 지금 시간대가 붐벼요. '쌍계사'를 먼저 가보세요.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "순서 바꾸기" }),
    ).toBeInTheDocument();
  });

  it("'순서 바꾸기' 클릭 시 onAccept에 해당 제안을 넘긴다", async () => {
    const onAccept = vi.fn();
    const suggestion = makeSuggestion();
    render(
      <CongestionSuggestions
        suggestions={[suggestion]}
        acceptedKeys={new Set()}
        onAccept={onAccept}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "순서 바꾸기" }));

    expect(onAccept).toHaveBeenCalledWith(suggestion);
  });

  it("이미 수락한 제안은(acceptedKeys에 있으면) 목록에서 뺀다", () => {
    const suggestion = makeSuggestion();
    const { container } = render(
      <CongestionSuggestions
        suggestions={[suggestion]}
        acceptedKeys={new Set([suggestionKey(suggestion)])}
        onAccept={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("swapWithContentId가 없으면 '순서 바꾸기' 버튼 없이 문구만 보여준다", () => {
    render(
      <CongestionSuggestions
        suggestions={[makeSuggestion({ swapWithContentId: null })]}
        acceptedKeys={new Set()}
        onAccept={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "순서 바꾸기" }),
    ).not.toBeInTheDocument();
  });
});
