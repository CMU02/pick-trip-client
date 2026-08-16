# 공통 푸터 신설

## Context

핸드오프 문서와 기존 코드 어디에도 푸터가 없었다. 사용자와 협의해 콘텐츠를 새로 정했다:
- 표준형(사이트맵 + 정책 링크)을 기본으로 하되, 이용약관/개인정보처리방침 페이지가 아직 없어서
  정책 링크 섹션은 이번엔 빼기로 결정
- 로고/소개, 사이트맵(홈/콘텐츠 탐색/AI일정), 지역 3곳(하동/영주/예천), 저작권만 포함

## 구현

- `src/components/layout/Footer.tsx` 신규 — `src/app/layout.tsx`에 전역 배치(Header와 달리
  `/share/[id]`에서도 숨기지 않음 — 공유 링크로 들어온 방문자에게도 브랜드/사이트맵 노출이 자연스러움)
- 3열(로고·소개 / 메뉴 / 지역) + 하단 저작권 한 줄. 코랄 테마 톤 유지하되 헤더보다 차분한
  `surface-2`(`oklch(0.985 0.008 30)`) 배경
- 지역 링크는 `RegionShowcase`와 동일하게 `/select/conditions?regions={region}`로 이동

## 테스트

- `Footer.test.tsx`: 메뉴/지역 링크 href, 저작권 문구 렌더링 확인

## 검증

```bash
bun run test
bun run lint
bun run build
```
