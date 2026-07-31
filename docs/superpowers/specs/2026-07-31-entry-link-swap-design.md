# "콘텐츠 탐색"/"AI일정" 진입 링크 맞바꾸기

## 배경

현재(2026-07-31) 홈/헤더의 두 진입점은 다음과 같이 연결돼 있다.

- **"콘텐츠 탐색"** (헤더 nav, HeroSection "콘텐츠 둘러보기", CtaSection "콘텐츠부터 골라보기"): `/select/conditions?regions=HADONG,YEONGJU,YECHEON` (여행조건 입력 페이지, Step 1)
- **"AI일정"** (헤더 nav "AI일정", HeroSection "AI 일정 살펴보기", CtaSection "AI 일정으로 바로가기"): `/itinerary` (바구니/조건 없이 진입하면 사실상 빈 화면)

`/contents` 페이지는 이미 지역 토글 버튼(`ContentFilter.tsx`, 커밋 `b77a724`/`8ca17fa`)을 갖춘 "지역 카드 페이지" 역할을 하고 있다. 이번 작업은 두 진입점의 목적지를 다음과 같이 맞바꾼다.

- **"콘텐츠 탐색"** → `/contents?regions=HADONG,YEONGJU,YECHEON` (지역 카드/필터가 있는 콘텐츠 탐색 페이지로 바로 진입)
- **"AI일정"** → `/select/conditions?regions=HADONG,YEONGJU,YECHEON` (여행조건 입력 Step 1부터 시작해서, 조건 입력 → `/contents`에서 콘텐츠 담기 → `/itinerary`에서 AI 일정 생성으로 이어지는 정상 흐름)

## 범위 밖 (명시적으로 다루지 않음)

`/contents`는 원래 `/select/conditions`(날짜 입력)를 거친 뒤에만 도달하던 페이지라 `startDate`/`nights` 쿼리가 항상 채워져 있었다. "콘텐츠 탐색"이 날짜 입력 없이 바로 `/contents`로 가면 `startDate`가 빈 문자열로 백엔드에 전달되는데, 이 케이스의 UX/데이터 처리는 사용자가 별도로 새 페이지를 만들어 다룰 예정이므로 이번 작업 범위에 포함하지 않는다. 링크 연결만 바꾼다.

## 변경 범위

### 1. `src/components/layout/Header.tsx`

`NAV_ITEMS` 배열의 두 항목을 수정한다.

- "콘텐츠 탐색": `href`를 `/select/conditions?regions=${ALL_REGIONS_QUERY}` → `/contents?regions=${ALL_REGIONS_QUERY}`로, `matchPath`를 `/select/conditions` → `/contents`로 변경.
- "AI일정": `href`를 `/itinerary` → `/select/conditions?regions=${ALL_REGIONS_QUERY}`로, `matchPath`를 `/itinerary` → `/select/conditions`로 변경.

두 `matchPath`가 각각 `/contents`, `/select/conditions`로 서로 겹치지 않으므로, `isNavActive`의 prefix 매칭(`startsWith`) 방식을 그대로 둬도 두 nav 항목이 동시에 활성화되는 문제는 없다.

### 2. `src/app/_components/HeroSection.tsx`

- "콘텐츠 둘러보기" `Link`의 `href`: `/select/conditions?regions=${ALL_REGIONS_QUERY}` → `/contents?regions=${ALL_REGIONS_QUERY}`
- "AI 일정 살펴보기" `Link`의 `href`: `/itinerary` → `/select/conditions?regions=${ALL_REGIONS_QUERY}`

### 3. `src/app/_components/CtaSection.tsx`

- "콘텐츠부터 골라보기" `Link`의 `href`: `/select/conditions?regions=${ALL_REGIONS_QUERY}` → `/contents?regions=${ALL_REGIONS_QUERY}`
- "AI 일정으로 바로가기" `Link`의 `href`: `/itinerary` → `/select/conditions?regions=${ALL_REGIONS_QUERY}`

## 테스트 변경

- `src/components/layout/Header.test.tsx`: "홈/콘텐츠 탐색/AI일정 네비게이션 링크를 올바른 href로 보여준다" 테스트의 기대값을 위 변경대로 수정. "현재 경로와 일치하는 nav 항목만 활성 상태로 표시한다"(경로 `/select/conditions`) 테스트는 이제 "AI일정"이 활성화되는 케이스로 의미가 바뀌므로 단언 대상을 "콘텐츠 탐색" → "AI일정"으로 수정. "/itineraries 경로에서는 AI일정(/itinerary) 링크를 활성화하지 않는다" 테스트는 `matchPath`가 `/select/conditions`로 바뀌었으므로 경로를 `/select/conditions/foo`가 아닌 무관 경로로 바꾸거나, `/contents` 등 실제로 활성화되면 안 되는 경로로 교체해 의도를 유지한다.
- `src/app/_components/HeroSection.test.tsx`: "콘텐츠 둘러보기"/"AI 일정 살펴보기" href 기대값 수정.
- `src/app/_components/CtaSection.test.tsx`: "콘텐츠부터 골라보기"/"AI 일정으로 바로가기" href 기대값 수정.
