import { afterEach, describe, expect, it, vi } from "vitest";
import { isSafeNextPath, oauthAuthorizationUrl } from "./authRedirect";

describe("isSafeNextPath", () => {
  it.each([
    ["/itinerary?regions=HADONG", true],
    ["/", true],
    ["/select/conditions", true],
  ])("%s -> %s (안전한 내부 경로)", (value, expected) => {
    expect(isSafeNextPath(value)).toBe(expected);
  });

  it.each([
    ["//evil.com", false],
    ["https://evil.com", false],
    ["evil.com", false],
    ["", false],
    [null, false],
    [undefined, false],
  ])("%s -> %s (open redirect 위험 또는 값 없음)", (value, expected) => {
    expect(isSafeNextPath(value)).toBe(expected);
  });
});

describe("oauthAuthorizationUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    ["kakao" as const, "http://localhost:8080/oauth2/authorization/kakao"],
    ["google" as const, "http://localhost:8080/oauth2/authorization/google"],
  ])("%s는 백엔드 기본 origin의 oauth2Login 진입점을 가리킨다", (provider, expected) => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", undefined);

    expect(oauthAuthorizationUrl(provider)).toBe(expected);
  });

  it("NEXT_PUBLIC_API_BASE_URL이 설정되면 그 origin을 사용한다", () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.picktrip.kr");

    expect(oauthAuthorizationUrl("kakao")).toBe(
      "https://api.picktrip.kr/oauth2/authorization/kakao",
    );
  });
});
