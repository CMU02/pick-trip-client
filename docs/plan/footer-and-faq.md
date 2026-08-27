# Task: 푸터 확장 + FAQ 페이지 신규

대상
- `src/components/layout/Footer.tsx` — 3열 → 4열로 확장
- `src/app/faq/page.tsx` — 신규 (정적 페이지, 백엔드 불필요)

색·폰트는 기존 그대로(코랄 / 제목 Paperlogy / 본문 Pretendard). 토큰은 `design_handoff_picktrip_redesign/README.md` 참고.
아이콘은 모두 `@/components/ui/icon`의 `Icon` 사용. 이모지 금지.

> 진행 메모 (2026-08-27): 이번 브랜치에서는 **A. 푸터 확장만** 구현한다. B. FAQ 페이지는 별도 이슈로 분리.
> 연락처 이메일은 `hyeonjun1968@naver.com`, 응답 시간은 `평일 09:00 – 18:00`으로 확정.
> 구글 폼(콘텐츠 오류 신고) URL은 미정이라 해당 링크는 렌더하지 않고 TODO 주석만 남긴다.

---

# A. 푸터 확장

현재 3열(브랜드 · 메뉴 · 지역)에서 **문의·지원** 블록 하나를 추가해 4열로 만듭니다.

**데이터 출처 고지 카드와 저작권 정책 링크는 넣지 않습니다** — 최종 검토에서 제외하기로 했습니다. 아래 1열 설명에 출처 카드가 있었지만 뺐고, 하단 바 법적 링크는 이용약관 / 개인정보처리방침 2개만 유지합니다.

## 그리드

```
grid-cols-1 sm:grid-cols-[1.55fr_0.9fr_0.9fr_1.05fr], gap 34px, padding 48px 40px 34px
```
기존 `max-w-7xl mx-auto`, 배경 `oklch(0.985 0.008 30)`, 상단 `border-t border-border` 유지.

## 1열 — 브랜드

기존 로고/설명 블록 그대로 둡니다. 추가 카드 없음.

## 2열 — 서비스 (기존 `메뉴` 확장)

`SITE_NAV`에 두 개 추가:
```ts
const SITE_NAV = [
  { href: "/", label: "홈" },
  { href: "/explore", label: "콘텐츠 탐색" },
  { href: "/select/conditions", label: "AI 일정 만들기" },
  { href: "/itineraries", label: "내 일정" },
  { href: "/favorites", label: "찜한 콘텐츠" },
] as const;
```
컬럼 제목은 `메뉴` → `서비스`. 제목 스타일 `11.5px / 800 / letter-spacing .1em / oklch(0.45 0.02 30)`,
링크 `13.5px / oklch(0.3 0.015 30)`, 호버 코랄, `gap 11px`.

`/itineraries`와 `/favorites`는 로그인이 필요한 페이지입니다. 비로그인 상태에서 눌리면 기존 가드가
로그인으로 보내주므로 푸터에서 따로 감출 필요는 없습니다.

## 3열 — 지역 (기존 유지)

`REGIONS` + `REGION_LABELS` 로 `/select/conditions?regions=<REGION>` 링크. **콘텐츠 개수는 표시하지 않습니다** —
Footer는 데이터를 가져오지 않는 서버 컴포넌트라 하드코딩하면 콘텐츠가 늘 때 숫자만 낡습니다.

## 4열 — 문의 · 지원 (신규)

제목 `문의 · 지원`. 링크 (라벨은 줄이지 말고 그대로 씁니다):

```ts
const SUPPORT_NAV = [
  { href: "/faq", label: "자주 묻는 질문", external: false },
  // TODO: 구글 폼 URL이 정해지면 아래 항목 추가한다. 신고가 쌓이면 자체 /report 페이지로 옮긴다.
  // { href: "https://forms.gle/REPLACE_ME", label: "콘텐츠 정보 오류 신고", external: true },
  { href: "mailto:hyeonjun1968@naver.com", label: "서비스 문의", external: true },
] as const;
```

- `external: true` → `target="_blank" rel="noopener noreferrer"` + 라벨 뒤에 `external-link` 아이콘 13px
  (`ICON_PATHS`에 없으면 추가: `"M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"`)
- 구글 폼 URL은 팀에서 폼을 만든 뒤 채워야 합니다. 미정이므로 이 항목은 렌더하지 않고 TODO 주석만 남깁니다 —
  빈 링크를 노출하는 것보다 낫습니다.

링크 목록 아래에 연락처 블록을 이어 붙입니다(같은 열, 구분선 포함):
- 구분선 `margin-top 18px; padding-top 16px; border-top 1px solid oklch(0.94 0.012 30)`
- `이메일` 라벨 `12px / oklch(0.5 0.015 30)`
- 주소 `13px / 700 / oklch(0.52 0.19 28)` — `mailto:` 링크 (`hyeonjun1968@naver.com`)
- 응답 시간 `12px / line-height 1.6 / oklch(0.5 0.015 30)`: `평일 09:00 – 18:00 응답` / `(주말·공휴일 제외)`

이 열은 다른 세 열보다 세로로 더 깁니다(연락처 블록 때문). **의도된 것**이니 다른 열 높이에 맞춰 줄이지 마세요.

## 하단 바

기존 구조 그대로 유지, **`LEGAL_NAV`는 항목을 추가하지 않습니다** (이용약관 / 개인정보처리방침 2개만).
크기만 12px로 올립니다(11.5px는 대비가 부족했습니다).

```ts
const LEGAL_NAV = [
  { href: "/terms", label: "이용약관", strong: false },
  { href: "/privacy", label: "개인정보처리방침", strong: true },
] as const;
```

- 저작권 줄, 약관 링크 모두 `12px`, 색 `oklch(0.5 0.015 30)` (기존 `text-muted-foreground` 유지도 가능 —
  단 11.5px 이하로 내리지 마세요. 대비 4.5:1을 못 넘깁니다)
- `개인정보처리방침`은 계속 `font-bold` + 진한 색

## 실서비스 전 추가 필요 (지금은 하지 않음)

실제 운영 단계가 되면 하단 바 위에 **사업자 정보** 한 줄(상호 / 대표자 / 사업자등록번호 / 주소 / 통신판매업 신고번호)과
데이터 출처 고지, 저작권 정책 링크가 필요합니다. 전자상거래법상 사업자 정보는 소비자가 쉽게 찾을 수 있는 위치에
표기해야 하고 관례적으로 그 위치가 푸터입니다 — 다만 **이번 작업 범위에는 포함하지 않습니다.**

---

# B. FAQ 페이지 (`/faq`)  — 별도 이슈로 분리 (이번 브랜치 범위 아님)

백엔드 없음. Q&A를 상수 배열로 두고 아코디언으로 렌더합니다.

## 레이아웃

```
헤더(기존)
main (max-width 1180px, padding 34px 36px 80px)
├── 브레드크럼: 홈 › 자주 묻는 질문
└── 2열 (1fr / 320px, gap 26px, align-items:start)
    ├── 좌: h1 + 설명 + 카테고리 탭 + 아코디언 목록
    └── 우: 문의 CTA → 오류 신고 카드 → 데이터 출처   (sticky top 86px, gap 14px)
푸터(기존)
```

- h1 **Paperlogy 800, 34px, -0.045em**: `자주 묻는 질문`
- 설명 `14.5px / 1.7 / oklch(0.48 0.015 30)`: `PickTrip 이용 중 자주 나오는 질문을 모았습니다. 찾는 답이 없으면 아래 문의 카드를 이용해주세요.`

## 카테고리 탭

`전체 / 이용 / 일정 / 콘텐츠 / 계정` — pill(radius 999px, padding `9px 16px`, `13px / 700`).
활성 = 코랄 solid, 비활성 = 흰 배경 + `1px solid oklch(0.92 0.012 30)`. 탭 전환 시 열린 항목은 닫습니다.

## 아코디언 항목

- radius 18px, `gap 10px`
- 닫힘: 배경 `oklch(0.994 0.004 30)`, 테두리 `oklch(0.93 0.012 30)`
- 열림: 배경 `#fff`, 테두리 `oklch(0.88 0.06 30)`
- 헤더 행(padding `19px 22px`, cursor pointer):
  - 좌측 26px `Q` 타일 — radius 9px, Paperlogy 800 12px. 닫힘 `oklch(0.96 0.02 30)` / `oklch(0.52 0.19 28)`, 열림 코랄 solid + 흰 글자
  - 질문 `15.5px / 700 / -0.02em / line-height 1.45`, `text-wrap: pretty`
  - 질문 아래 카테고리 태그 `11.5px / 700 / oklch(0.55 0.06 30)`
  - 우측 `chevron-down` 17px — 열리면 `rotate(180deg)`, transition `.18s`
- 답변 영역(열릴 때만): `padding: 0 22px 22px 62px` (좌측 62px는 Q 타일 폭에 맞춘 들여쓰기),
  상단 `1px solid oklch(0.95 0.008 30)` 구분선 후 본문 `14px / 1.75 / oklch(0.4 0.015 30)`, `text-wrap: pretty`
- 답변에 관련 링크가 있으면 아래에 `13px / 700 / 코랄` 링크 한 줄

**접근성**: 헤더는 `<button aria-expanded>`, 답변은 `<div role="region" aria-labelledby>`. 한 번에 하나만 열립니다.

## 질문 8개 (그대로 사용)

| 카테고리 | 질문 |
|---|---|
| 이용 | 로그인하지 않아도 이용할 수 있나요? |
| 일정 | AI 일정 생성은 얼마나 걸리나요? |
| 일정 | 콘텐츠를 몇 개 담아야 일정을 만들 수 있나요? |
| 일정 | 생성된 일정을 수정할 수 있나요? |
| 콘텐츠 | 장소 정보가 실제와 다릅니다. → 오류 신고 링크 포함 |
| 콘텐츠 | 하동·영주·예천 외 지역도 추가되나요? |
| 계정 | 담은 콘텐츠는 얼마나 유지되나요? |
| 계정 | 계정을 삭제하면 저장한 일정도 사라지나요? |

답변 전문은 `FAQ 페이지.dc.html`의 `FAQS` 배열에 있습니다. 그대로 옮기세요.
**답변 내용을 새로 쓰지 마세요** — 30초, 최소 2개, 하루 3~4곳 같은 수치는 실제 구현과 맞춰 적은 것입니다.
구현이 달라졌다면 수치를 고치되, 없는 기능을 답변에 넣지 마세요.
(주의: 현재 저장소에 `FAQ 페이지.dc.html`이 없으므로, FAQ 이슈 착수 시 원문 확보가 선행되어야 합니다.)

## 우측 사이드

1. **문의 CTA** — radius 22px, padding 24px, 코랄 그라데이션 `linear-gradient(140deg, oklch(0.63 0.2 30), oklch(0.51 0.19 14))`
   - 제목(Paperlogy 700, 18px) `찾는 답이 없나요?` + 설명 `12.5px`
   - 흰 버튼 `서비스 문의하기` → `mailto:hyeonjun1968@naver.com`, 아래에 주소 노출
2. **오류 신고 카드** — 흰 배경, 코랄 세로바 + `정보가 실제와 다른가요?` + 설명 + `콘텐츠 정보 오류 신고` 링크(외부 아이콘)
3. **데이터 출처 카드** — `oklch(0.99 0.006 30)` 배경, 오버라인 `DATA SOURCE`(`11.5px/800/letter-spacing .1em/oklch(0.5 0.06 30)`) +
   본문 `12px/1.7/oklch(0.48 0.015 30)`: `한국관광공사 TourAPI 및 공공데이터포털의 관광 정보를 활용합니다.`
   (**FAQ 페이지 안에서만 씁니다.** 푸터에는 넣지 않습니다 — 위 A절 참고.)

## SEO

FAQ는 검색 유입이 있는 페이지입니다. `generateMetadata`로 title/description을 넣고,
JSON-LD `FAQPage` 스키마를 `<script type="application/ld+json">`으로 함께 출력하면 검색 결과에 질문이 노출됩니다.
같은 `FAQS` 배열에서 생성하면 되므로 중복 관리가 필요 없습니다.

## 상세 페이지에도 신고 링크

푸터·FAQ의 신고 링크는 "어디서든 접근 가능한 입구"입니다. 콘텐츠 상세 페이지 하단에도
`이 정보가 정확하지 않나요?` 링크를 두고 `?contentId=<id>` 를 넘기면 어떤 장소에 대한 신고인지 바로 알 수 있습니다.
구글 폼은 URL 파라미터로 필드 프리필이 가능하니(`?usp=pp_url&entry.XXX=값`) 폼 만들 때 장소 ID 필드를 넣어두세요.

## 테스트

- `Footer.test.tsx` — `SUPPORT_NAV` 항목이 렌더된다 / 외부 링크에 `rel="noopener noreferrer"`가 붙는다 / 하단 바 법적 링크가 2개(이용약관, 개인정보처리방침)뿐인지 확인한다
- `faq/page.test.tsx` — 기본 상태에서 첫 항목만 열려 있다 / 항목 클릭 시 토글된다 / 카테고리 탭으로 필터된다 / `aria-expanded`가 상태와 일치한다

## 하지 말 것

- 소셜 미디어 아이콘 추가하지 않기 (운영하는 계정이 없으면 빈 링크가 됩니다)
- 뉴스레터 구독 폼 넣지 않기 (발송 계획이 없습니다)
- 지역별·카테고리별 콘텐츠 개수를 푸터에 하드코딩하지 않기
- FAQ 답변에 없는 기능(알림, 예약, 결제 등)을 언급하지 않기
- 이모지 사용하지 않기
- **푸터에 데이터 출처 카드나 저작권 정책 링크를 넣지 않기** (최종 결정으로 제외됨 — FAQ 페이지에만 출처 카드가 남습니다)
