# Task: 콘텐츠 상세 화면 — 2열 레이아웃 + 카카오맵 사이드 패널

대상 파일: `src/app/contents/[id]/_components/ContentDetailView.tsx` (단일 파일 개편 + 지도 컴포넌트 1개 신규)
디자인 시안: `콘텐츠 상세 2열 지도.dc.html` (옵션 비교는 `콘텐츠 상세 + 지도.dc.html`)

기존 동작(뒤로가기 `router.back()`, 최근 본 콘텐츠 기록, `showBasketAction`/`backHref` prop, `InfoRow`의 "정보 없음" 표시)은 **그대로 유지**한다. 바뀌는 것은 레이아웃과 지도 패널 추가뿐이다.

---

## 1. 레이아웃 변경

현재: `mx-auto w-full max-w-2xl px-4 py-6` 한 열.
변경: 컨테이너를 `max-w-[1120px]`로 넓히고, `lg`(1024px) 이상에서만 2열.

```tsx
<div className="mx-auto w-full max-w-[1120px] px-4 py-6 lg:px-10">
  <button …>← 목록으로</button>

  <div className="mt-1.5 grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-[34px]">
    <div className="min-w-0">{/* 본문 */}</div>

    {/* 지도 패널: 모바일에서는 본문 아래로 내려간다 */}
    <aside className="self-stretch">
      <div className="flex flex-col gap-3.5 lg:sticky lg:top-6">…</div>
    </aside>
  </div>
</div>
```

⚠ sticky 주의: 그리드에 `items-start`가 걸리면 `<aside>`가 콘텐츠 높이로 줄어들어 sticky가 움직일 여지가 없다. **`<aside>`에 `self-stretch`를 주고 sticky는 그 안쪽 래퍼에 건다.** (시안에서 실제로 밟은 버그)

### 왼쪽 열 순서
1. 대표 사진 — `aspect-[16/10] rounded-[24px]`, 좌상단 카테고리 배지(`bg-primary` 흰 글씨, `px-3.5 py-1.5 text-[11.5px] font-extrabold`)
2. 썸네일 4칸 — `grid-cols-4 gap-2.5`, `aspect-[4/3] rounded-[13px]`. `allImages.length > 1`일 때만 렌더, 4장 초과면 마지막 칸에 `+{n}`
3. `h1` — `text-[34px] font-extrabold tracking-[-0.05em]` (기존 26px에서 확대)
4. 주소 — `mt-2 text-sm text-muted-foreground`
5. 개요 — `mt-5 text-[15.5px] leading-[1.85] text-foreground/80` + `text-wrap: pretty`
6. 스펙 그리드 — 기존 `InfoRow` 그대로, `mt-6 grid gap-2.5 sm:grid-cols-2` (패딩만 `px-[17px] py-[15px]`)
7. (선택) 근처 콘텐츠 3칸 — 아래 6번 참고

### 오른쪽 패널 순서 (`rounded-[20px] border border-border`)
1. 지도 250px
2. 주소 + 거리 한 줄
3. `주소 복사` / `카카오맵 길찾기` 2버튼 (`min-h-11`, `grid-cols-2 gap-2`)
4. 구분선 아래 — `일정에 담기`(primary, `min-h-[52px] text-[15px] font-extrabold`), `♡ 찜하기`(`bg-muted`, `min-h-11`), 안내 문구 `text-[11px] text-muted-foreground`

기존 상단 우측의 찜/담기 버튼 쌍은 **제거**하고 이 패널로 옮긴다. `showBasketAction === false`면 3·4번 블록 중 담기/찜만 숨기고 지도·길찾기는 남긴다.

모바일(`lg` 미만)에서는 패널이 본문 아래로 쌓인다. 담기/찜하기는 하단 고정 바로 뺄지 여부는 별도 판단 — 이번 작업 범위에서는 패널 안에 그대로 둔다.

---

## 2. 지도 컴포넌트 신규

새 파일 `src/app/contents/[id]/_components/ContentMap.tsx`

- `useKakaoMap()` 훅 재사용 (`src/hooks/useKakaoMap.ts`)
- 마커 1개(`CustomOverlay`, 코랄 원 + 흰 테두리) + `map.setCenter` / `setLevel(4)`
- `ItineraryMap.tsx`의 패턴을 그대로 따른다: 생성/그리기를 한 effect에, `ResizeObserver`로 `relayout()`, 언마운트 시 오버레이 정리
- 상태 오버레이 문구도 `ItineraryMap`과 동일하게 맞춘다
  - `loading` → "지도를 불러오는 중…"
  - `error` → "지도를 불러오지 못했어요"
- 컨테이너: `relative h-[250px] w-full overflow-hidden bg-muted` (패널이 라운드를 갖고 있으므로 지도 자체는 라운드 없이 `overflow-hidden`으로 잘린다)
- 확대/축소 버튼은 우상단에 커스텀(30×30, 흰 배경, `border-border`) — `map.setLevel(map.getLevel() ± 1)`

### 좌표 없을 때 (폴백)
`src/lib/geo.ts`의 `isValidKoreaCoord(latitude, longitude)`로 판단한다. TourAPI 원본이 비면 `0`이 내려온다.

```tsx
const hasCoord = isValidKoreaCoord(content.latitude, content.longitude);
```

- `hasCoord === false` → 지도를 마운트하지 않고 같은 높이의 안내 박스만: "이 콘텐츠에는 위치 좌표가 없어요. 주소로 검색해 주세요." (`bg-muted text-[12.5px] text-muted-foreground`, 중앙 정렬)
- 이때 `카카오맵 길찾기` 버튼은 **숨긴다**. `주소 복사`는 남긴다.
- 거리 한 줄도 "하동읍에서 차로 약 22분" 대신 "주소 기준"으로 대체(또는 생략)

---

## 3. 두 버튼 동작

```ts
// 주소 복사
await navigator.clipboard.writeText(content.address);
// → 버튼 라벨을 2초간 "복사됨"으로 바꾼다 (토스트 도입 전 임시)

// 카카오맵 길찾기 (새 창)
const url = `https://map.kakao.com/link/to/${encodeURIComponent(content.name)},${content.latitude},${content.longitude}`;
window.open(url, "_blank", "noopener,noreferrer");
```

---

## 4. 거리 문구

"하동읍에서 차로 약 22분"은 시안용 더미다. 실제 데이터가 없으면 **문구를 넣지 않는다.** 넣으려면 둘 중 하나:
- 지역 중심 좌표(하동읍/영주시청/예천군청) 상수 + `haversineKm`(`src/lib/geo.ts`)로 "지역 중심에서 직선거리 약 N km"
- Kakao Mobility Directions(`/api/directions`)를 상세에서도 호출 — 비용·키 이슈 있으니 이번엔 보류 권장

---

## 5. 시안에서 쓴 값 정리

| 항목 | 값 |
| --- | --- |
| 컨테이너 최대폭 | 1120px |
| 2열 분기 | `lg` (1024px) |
| 사이드 컬럼 폭 | 360px |
| 열 간격 | 34px |
| sticky top | 24px |
| 지도 높이 | 250px |
| 패널 라운드 | 20px |
| 사진 라운드 / 비율 | 24px / 16:10 |
| 제목 | 34px, extrabold, `-0.05em` |
| 모든 버튼 최소 높이 | 44px (담기 52px) |

색은 전부 기존 토큰(`primary`, `muted`, `border`, `muted-foreground`, `accent`) 사용 — 새 색을 추가하지 않았다.

---

## 6. 근처에 함께 담기 (선택 — 별도 승인 필요)

시안 하단에 3칸 카드로 들어가 있지만, **지금 API로는 만들 수 없다.** 같은 지역·다른 카테고리 목록을 잘라 쓰는 방식이면 가능하나 "근처"라는 표현은 좌표 기반이 아니라 부정확하다. 확정 전까지는 이 섹션을 **구현하지 않는다.**

---

## 7. 테스트

`ContentDetailView.test.tsx`에 추가:
- 좌표가 유효하면 지도 컨테이너가 렌더되고 `카카오맵 길찾기` 버튼이 보인다
- `latitude: 0, longitude: 0`이면 안내 문구가 보이고 길찾기 버튼이 없다
- `주소 복사` 클릭 시 `navigator.clipboard.writeText`가 주소로 호출된다
- `showBasketAction={false}`면 담기/찜 버튼이 없다 (기존 테스트 유지)

`ContentMap` 테스트는 `ItineraryMap.test.tsx`의 kakao 전역 목(mock)을 재사용한다.

---

## 진행 상황 (2026-08-30) — 이어서 작업할 사람용

브랜치 `feat/5`, 이슈 #5, PR #6. `origin/feat/5`에 전부 push 완료. `main` 미머지.

### 완료

- **§1 2열 레이아웃** — `ContentDetailView.tsx` 개편 완료 (커밋 `02bd76e`). `max-w-[1120px]`,
  `lg`+ `grid-cols-[minmax(0,1fr)_360px]` gap 34px, `<aside class="self-stretch">` + 안쪽
  `lg:sticky lg:top-6`. 왼쪽(사진/제목 34px/개요 `[text-wrap:pretty]`/InfoRow), 오른쪽 패널
  (`rounded-[20px] border`). 상단 우측 찜/담기 쌍 제거 → 패널 이관. `showBasketAction===false`면
  담기/찜만 숨김.
- **§2 ContentMap.tsx 신규** (커밋 `02bd76e`) — `useKakaoMap` + `ItineraryMap` 패턴, `CustomOverlay`
  마커 1개, 우상단 커스텀 확대/축소(`getLevel ± 1`), 상태 문구 `ItineraryMap`과 동일,
  `data-testid="content-map"`. `types/kakao.d.ts`에 `Map.getLevel()`, `src/test/kakaoMapMock.ts`에
  `getLevel`/level 추적 추가.
- **§2 좌표 폴백** — `isValidKoreaCoord` false면 안내 박스 + `카카오맵 길찾기` 숨김, `주소 복사` 유지.
- **§3 두 버튼** — 주소 복사(2초 "복사됨"), 카카오맵 길찾기(`window.open`, 좌표 있을 때만).
- **§4 거리 문구** — 넣지 않음(실데이터 없음).
- **§7 테스트** — `ContentMap.test.tsx` 신규, `ContentDetailView.test.tsx` 케이스 추가. 담기 버튼
  라벨 "담기/담김" → "일정에 담기/일정에 담김"으로 바뀌어 기존 exact-name 테스트 2개 수정.
- **사진 갤러리** (커밋 `0b40525`, 스펙 외 추가 — 리뷰 중 사용자 요청) — `ContentGallery.tsx` 신규.
  여러 장일 때 히어로 양옆 화살표(기본 `opacity-40` → group-hover/focus 시 `opacity-100`, 양끝
  순환) + `n / N` 배지, 아래 썸네일 클릭 전환(활성 `ring-2 ring-primary`). 썸네일 4열 그리드 전체
  노출(기존 "처음 4장 + N" 오버레이 제거). 콘텐츠 변경 시 `key={content.id}` remount로 인덱스 초기화.
  `ContentGallery.test.tsx` 6케이스 + ContentDetailView 통합 2케이스.

검증: `bun run test`(593) · `bunx tsc --noEmit` · `bun run lint` · `bun run build`(27/27) 전부 통과.

### 남은 일 (다음 세션)

1. **육안 확인 안 됨** — `bun run dev` + `.env`에 `NEXT_PUBLIC_KAKAO_JS_KEY` 필요. 확인 항목:
   2열 전환(1024px), `<aside>` sticky 실제 동작, 지도 마커 위치, 확대/축소 버튼, 좌표 없음 폴백,
   갤러리 화살표 hover 트랜지션·썸네일 ring, 모바일에서 패널이 본문 아래로 쌓이는지.
2. **§6 "근처에 함께 담기"** — 이번엔 제외했으나, 그 사이 `contentService.getNearbyContents()`
   (브랜치 `feat/content-nearby-api`, 백엔드 `GET /api/v1/contents/{id}/nearby`)가 생겨서 이제
   좌표 기반으로 진짜 구현 가능. 왼쪽 열 맨 아래 3칸 카드. 사용자 승인 후 진행.
3. **모바일 담기/찜 하단 고정 바** — §1에서 "별도 판단"으로 남긴 항목. 현재는 패널 안에 그대로 둠.
4. 거리 문구(§4) — 지역 중심 좌표 상수 + `haversineKm`로 "직선거리 약 N km" 넣을지 재검토.
5. 갤러리 추가 개선 여지 — 키보드 좌우 화살표 네비, 스와이프(터치), 라이트박스(전체 화면) 등은
   현재 미구현.

### 이어서 시작하는 법

```
git checkout feat/5
bun install   # 필요 시
```

파일: `src/app/contents/[id]/_components/` 안 `ContentDetailView.tsx` · `ContentMap.tsx` ·
`ContentGallery.tsx` (+ 각 `.test.tsx`). 지원 변경: `src/types/kakao.d.ts`, `src/test/kakaoMapMock.ts`.
