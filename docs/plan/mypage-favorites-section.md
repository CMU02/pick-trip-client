# 마이페이지 찜한 콘텐츠 섹션 (이슈 #62)

## 현재 상태

찜 섹션 자체는 `MyPageClient.tsx`에 이미 구현돼 있다(빈 상태 안내, 4개 미리보기
그리드, `/favorites` 더보기 링크). 이슈 #62가 닫히지 않은 채 `db1a4ad`(#65 대형
커밋)에 섞여 들어왔다. 이슈 스펙과 어긋난 부분만 마감한다.

## 고칠 것

### 1. 최근 찜한 순으로 (버그)

`favoritesPreview = favoriteItems.slice(0, 4)` → `favoriteStore.add`가 뒤에
append하므로 `items[0]`은 **가장 먼저** 찜한 것. 현재는 오래된 4개를 보여준다.
`/favorites` 페이지는 `[...items].reverse()`로 최신순을 제대로 보여주는데
마이페이지만 반대다.

→ `[...favoriteItems].reverse().slice(0, 4)`

### 2. "4개 초과 시" 더보기

현재 `favoriteItems.length > 0`이면 항상 더보기가 뜬다. 이슈는 "4개 초과 시".
(4개 이하일 때는 상단 링크 카드 "찜한 콘텐츠 → /favorites"로 이동 가능.)

→ `favoriteItems.length > FAVORITES_PREVIEW_COUNT`

### 3. 빈 상태 아이콘

`<span>♡</span>` 문자 → `<Icon name="heart">` (프로젝트 "이모지 금지, Icon 사용" 규칙).

## 범위 밖

- "`RecommendedCard` 재사용"(이슈 문구) — 코랄 리디자인 핸드오프 §11이 "4열 미니
  카드(사진 110px + 이름 13.5px + 주소 11.5px)"를 명시했고 `RecommendedCard`는
  담기/찜 버튼이 붙어 미리보기에 안 맞는다. 현재 커스텀 미니 카드 유지.

## 테스트

- `MyPageClient.test.tsx`: 최신순 노출 검증 추가, 빈 상태·미리보기 카드 기존 유지.

## 검증

```bash
bun run lint
bun run test
bun run build
```
