# 코드 규칙

## 기본 원칙

- TypeScript strict 모드를 전제로 작성한다.
- 기능보다 타입을 먼저 명확히 한다.
- any는 기본적으로 사용하지 않는다. 외부 API 응답처럼 경계가 불명확한 값은 unknown에서 검증 후 좁힌다.
- 컴포넌트는 작고 목적이 분명해야 한다.
- 공통화는 실제 중복과 변경 이유가 생긴 뒤 적용한다.

## Next.js App Router

- `src/app`의 `page.tsx`, `layout.tsx`는 기본적으로 Server Component로 유지한다.
- 이벤트 핸들러, React state, effect, 브라우저 API가 필요할 때만 `"use client"`를 사용한다.
- `"use client"`는 파일 최상단에 작성한다.
- `"use client"`가 붙은 파일에는 서버 secret, DB 접근, 서버 전용 fetch helper를 import하지 않는다.
- Dynamic route의 `params`, `searchParams`는 Next.js 16 문서에 따라 Promise로 처리한다.
- route-level 로딩은 `loading.tsx`, 에러는 `error.tsx`, not found는 `not-found.tsx`를 사용한다.

## 파일과 디렉터리

| 대상 | 규칙 | 예시 |
| --- | --- | --- |
| 컴포넌트 파일 | PascalCase | `ContentCard.tsx` |
| 훅 파일 | camelCase 또는 use 접두사 | `useSelectedContents.ts` |
| 서비스 파일 | camelCase + Service | `contentService.ts` |
| 타입 파일 | 도메인명 | `content.ts` |
| 라우트 전용 폴더 | `_components`, `_lib` | `src/app/content/_components` |

## 네이밍

| 항목 | 규칙 | 예시 |
| --- | --- | --- |
| 컴포넌트 | PascalCase | `RegionSelector` |
| 함수 / 변수 | camelCase | `fetchContents` |
| 전역 상수 | UPPER_SNAKE_CASE | `DEFAULT_PAGE_SIZE` |
| 이벤트 핸들러 | handle + 동작 | `handleRegionChange` |
| Props 타입 | 컴포넌트명 + Props | `RegionSelectorProps` |
| API 응답 타입 | 도메인 + Response | `ContentListResponse` |

## 컴포넌트 작성

```tsx
interface ContentCardProps {
  title: string;
  region: string;
  onSelect?: () => void;
}

export function ContentCard({ title, region, onSelect }: ContentCardProps) {
  return (
    <article>
      <h2>{title}</h2>
      <p>{region}</p>
      {onSelect ? <button onClick={onSelect}>선택</button> : null}
    </article>
  );
}
```

- Props는 명시적으로 선언한다.
- boolean prop은 긍정형으로 작성한다. 예: `isSelected`, `isLoading`.
- 조건부 렌더링은 읽기 쉽게 분리한다.
- 리스트 key에는 index보다 안정적인 id를 사용한다.

## API 호출

- API 호출 로직은 컴포넌트 안에 길게 작성하지 않는다.
- 서비스 함수에서 request/response 타입을 명시한다.
- 서버 secret이 필요한 호출은 브라우저에서 직접 호출하지 않는다.
- 실패 응답은 공통 오류 타입으로 정규화한다.

## 스타일

- Tailwind CSS 4를 기본 스타일링 방식으로 사용한다.
- 반복되는 스타일 조합은 컴포넌트 또는 작은 helper로 정리한다.
- 색상, spacing, typography는 일관된 토큰 사용을 우선한다.
- 모바일 화면에서 텍스트와 버튼이 겹치지 않게 반응형 제약을 둔다.

## 접근성

- 버튼에는 실제 `button` 요소를 사용한다.
- 링크 이동은 `next/link` 또는 `a`를 목적에 맞게 사용한다.
- 이미지에는 의미 있는 `alt`를 제공한다. 장식 이미지는 빈 alt를 사용한다.
- 폼 입력에는 label 또는 접근 가능한 이름을 제공한다.
- 로딩과 오류 상태는 시각적으로만 전달하지 않는다.

## 금지

- `node_modules`, `.next`, `next-env.d.ts` 직접 수정
- secret을 `NEXT_PUBLIC_`로 노출
- 큰 화면 전체를 불필요하게 Client Component로 전환
- 서버 응답을 검증 없이 `as`로 강제 캐스팅
- `dangerouslySetInnerHTML` 기본 사용
