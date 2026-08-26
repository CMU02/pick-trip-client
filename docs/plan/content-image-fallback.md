# 이미지 없는 콘텐츠 카드 — `이미지 없음` 대신 카테고리 아이콘 플레이스홀더

대상: 콘텐츠 이미지를 보여주는 모든 곳 (콘텐츠 목록·둘러보기·추천·찜한 목록·상세·바구니·최근 본 목록)
문제: `content.imageUrl`이 없으면 지금은 회색 면에 `이미지 없음` 텍스트가 뜬다. 이걸 **카테고리 아이콘 플레이스홀더**로 바꾼다.

색·폰트는 기존 그대로(코랄 / 제목 Paperlogy / 본문 Pretendard).

## 디자인 (B안 — 흰 면 + 원형 타일)

이미지 영역 전체를 채우고, 중앙에 원형 타일 하나. 텍스트 없음.

- 컨테이너: 배경 `oklch(0.99 0.006 30)`, 이미지 영역과 동일한 크기·radius (부모가 `overflow:hidden`이므로 자체 radius 불필요)
- 중앙 원: `width/height 62px`, `border-radius: 999px`, 배경 `#fff`
  - 이중 링은 box-shadow로: `0 0 0 1px oklch(0.91 0.03 30), 0 0 0 8px oklch(0.97 0.02 30)`
- 아이콘: 26px, 색 `oklch(0.62 0.16 28)` (코랄)
- 카테고리 배지, 하트 버튼 등 기존 오버레이는 그대로 위에 얹힌다 (플레이스홀더는 배경 레이어)

### 크기 대응 (`size` prop)

| 사용처 | 컨테이너 | 원 | 아이콘 | 링 |
|---|---|---|---|---|
| 카드 이미지 (목록/추천/찜/둘러보기) | 140–150px | 62px | 26px | `1px + 8px` (`lg`) |
| 마이페이지 미니 카드 | 110px | 48px | 21px | `1px + 6px` (`md`) |
| 바구니 / 최근 본 썸네일 | 42px | 원 없음 | 19px | — (`sm`) |
| 상세 오버레이 히어로 | 230px | 84px | 36px | `1px + 10px` (`xl`) |

**42px 이하(`sm`)에서는 원을 그리지 않는다.** 타일 자체를 배경으로 쓰고 아이콘만 중앙에 둔다
(배경 `linear-gradient(160deg, oklch(0.975 0.02 30), oklch(0.95 0.04 32))`, 아이콘 색 `oklch(0.7 0.12 30)`).

## 카테고리 → 아이콘 매핑

기존 `@/types/content`의 `CATEGORY_ICONS`(카테고리 필터 칩과 동일한 Ionicons 매핑)를 재사용한다.
`ContentCategory` 6종 전부 매핑되어 있고, 카테고리 값이 없거나 매핑에 없으면 `CATEGORY_ICONS.ATTRACTION`(compass)으로 폴백한다.

## 구현

### `src/components/ContentImageFallback.tsx` (신규)

`이미지 없음` 텍스트를 대체하는 순수 플레이스홀더. `category`, `size`(`sm`|`md`|`lg`|`xl`), `className`을 받는다.
- `sm`: 원 없이 그라디언트 타일 배경 + 아이콘
- `md`/`lg`/`xl`: 흰 면 + 흰 원 + box-shadow 이중 링 + 코랄 아이콘
- `aria-hidden` — 장소 이름은 카드 본문에 이미 있으므로 접근성 트리에서 제외
- 색은 `Icon`이 `style`을 받지 않아 `className`의 Tailwind arbitrary(`text-[oklch(...)]`, svg `currentColor` 상속)로 넘긴다

### `src/components/ContentImage.tsx` (신규, 클라이언트)

7개 호출부의 `imageUrl ? <Image> : 텍스트` 분기를 한 컴포넌트로 통일.
- `src`, `alt`, `category`, `size`, `sizes` prop
- `src`가 없으면 → `ContentImageFallback`
- `<Image onError>`로 404 등 로드 실패도 → `failed` state → 같은 플레이스홀더
- 항상 `fill`, `object-cover`. 부모가 크기/`overflow` 관리

### 적용 지점 (7곳)

| 파일 | 컨테이너 | size |
|---|---|---|
| `src/components/RecommendedCard.tsx` | 140px | `lg` |
| `src/app/explore/_components/ExploreCard.tsx` | 150px | `lg` |
| `src/app/contents/_components/ContentCard.tsx` | 140px | `lg` |
| `src/app/dashboard/for-you/_components/ForYouCard.tsx` | 140px | `lg` |
| `src/app/mypage/_components/MyPageClient.tsx` | 110px | `md` |
| `src/app/dashboard/_components/RecentSection.tsx` | 42px | `sm` |
| `src/app/contents/[id]/_components/ContentDetailView.tsx` | 230px | `xl` |

`ExploreCard`는 서버 컴포넌트지만 클라이언트 자식(`ContentImage`) 렌더는 문제 없음.

## 테스트

`src/components/ContentImageFallback.test.tsx`
- `category="FOOD"` → 음식(restaurant) 아이콘 path 렌더
- `category={null}` → 관광지(compass) 아이콘으로 폴백
- `size="sm"` → 원형 타일(`rounded-full`) 없음 / `size="lg"` → 있음
- 루트가 `aria-hidden`

기존 카드 테스트는 `이미지 없음` 텍스트를 단언하지 않아 수정 불필요.

## 하지 않은 것

- 플레이스홀더 내 텍스트(`사진 준비 중` 등) 없음 — 아이콘만
- 카테고리별 배경색 분기 없음 — 배경 고정, 아이콘만 변경
- 이모지 미사용
- 바구니 패널/드로어는 썸네일 이미지를 렌더하지 않아 대상 아님

## 구현 메모 (원안과 다른 점)

- 원안은 `@/components/ui/icon`에 `food`/`festival`/... 키와 `ICON_PATHS` 추가를 제안했으나, 실제 `Icon`은 `FILL_ICON_PATHS`/`STROKE_ICONS` 구조이고 `@/types/content`에 이미 6종 전부 매핑한 `CATEGORY_ICONS`가 있어 그대로 재사용했다. 아이콘 path 추가 없음.
- 원안의 `ContentImageFallback` 단독 교체 대신, 404 폴백(`onError`)까지 함께 처리하려 `ContentImage` 래퍼를 만들어 7개 호출부의 중복 분기를 제거했다.
