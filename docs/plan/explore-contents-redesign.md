# 콘텐츠 탐색 화면 코랄 리디자인

## Context

전체 화면 리디자인 3단계([[home-redesign]], [[dashboard-redesign]]에 이어). `/explore`, `/contents`, `/contents/[id]`를 대상으로 한다. 별도 디자인 핸드오프 문서는 없어 홈/대시보드에서 확립한 코랄 언어(코랄 accent, 카드 호버 시 `-translate-y-1` + `border-primary/40` + `shadow-lg`)를 확장 적용한다.

이 화면군 대부분(`ContentFilter`, `ContentDetailView`, `Button`)은 이미 전역 토큰(`border-primary`, `bg-accent`, `text-accent-foreground`, `Button` 컴포넌트)만 사용하고 있어 코랄 테마 토큰 교체로 이미 반영돼 있다. 실질적으로 손댈 부분은 두 카드 컴포넌트의 호버 효과뿐이다.

**`CATEGORY_BADGE_CLASSES`(`src/types/content.ts`)는 이번에 손대지 않기로 결정한다.** 6개 카테고리를 시각적으로 구분하는 기능적 배지라, 전부 코랄로 바꾸면 카테고리 구분력이 사라진다. 기존 `-50/-700` 파스텔 톤은 코랄 primary와 함께 있어도 충돌하지 않아 유지한다.

## 구현

### ExploreCard.tsx
- 카드 호버: `hover:-translate-y-0.5 hover:shadow-md` → `hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg`(홈 지역 카드/대시보드 ForYouCard와 통일)

### ContentCard.tsx (contents 목록, 담기 버튼 포함)
- 카드 호버: 위와 동일하게 통일

### 변경 없음
- `ExploreGrid.tsx`, `ContentGrid.tsx`, `ContentFilter.tsx`, `ContentDetailView.tsx`, `explore/page.tsx`, `contents/page.tsx`, `contents/[id]/page.tsx` — 이미 전역 토큰/`Button` 컴포넌트만 사용해 코랄 테마가 자동 반영됨
- `dashboard/for-you`의 `ForYouCard.tsx`는 [[dashboard-redesign]]에서 이미 동일한 호버 톤으로 통일 완료

## 테스트

기존 `ExploreCard.test.tsx`, `ContentCard.test.tsx`는 텍스트/role 기준 검증이라 클래스명 변경으로 깨지지 않는다. 별도 테스트 추가 없이 기존 스위트로 회귀만 확인한다.

## 검증

```bash
bun run test
bun run lint
bun run build
```

추가로 `bun run dev`에서 `/explore`, `/contents`, `/contents/[id]` 접속해 카드 호버와 필터 pill 선택 상태가 코랄 톤으로 보이는지 육안 확인.
