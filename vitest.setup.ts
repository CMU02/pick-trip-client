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

// jsdom에는 IntersectionObserver가 없다. 히어로 슬라이더처럼 화면 밖 이탈을
// 감지해 자동 전환을 멈추는 컴포넌트가 마운트 시 이를 호출한다.
if (typeof IntersectionObserver === "undefined") {
  class IntersectionObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // biome-ignore lint/suspicious/noExplicitAny: jsdom 전역에 없는 브라우저 API를 최소 구현으로 채운다
  (globalThis as any).IntersectionObserver = IntersectionObserverStub;
}

// jsdom에는 matchMedia가 없다. prefers-reduced-motion 감지에 쓰인다.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
