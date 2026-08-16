import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// 각 테스트 후 렌더링된 DOM을 정리해 테스트 간 간섭을 막는다.
afterEach(() => {
  cleanup();
});

// jsdom에는 ResizeObserver가 없다. Tooltip 등 Radix Popper 기반 컴포넌트가
// 위치 계산에 내부적으로 이를 사용해, 없으면 렌더 중 예외가 난다.
if (typeof ResizeObserver === "undefined") {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // biome-ignore lint/suspicious/noExplicitAny: jsdom 전역에 없는 브라우저 API를 최소 구현으로 채운다
  (globalThis as any).ResizeObserver = ResizeObserverStub;
}
