# 비로그인 상태에서 찜 하트 비활성화

## 문제

`favoriteStore`는 `localStorage`(`pick-trip-favorites`)만 사용한다. 로그인 여부와 무관하게
로컬에 저장된 찜 데이터를 읽어 하트가 활성(빨간색)으로 표시된다.

- 로그아웃했는데도 이전에 찜한 콘텐츠의 하트가 그대로 활성으로 보인다.
- `/favorites` 페이지에는 "찜한 콘텐츠를 다시 보려면 로그인이 필요합니다"라고 안내하는데,
  카드의 하트 상태와 어긋난다. (FAQ `login-not-required` 답변과도 불일치)

## 로그아웃 상태에서 하트가 노출되는 지점

라우트 가드가 있는 화면(`/favorites`, `/mypage`, `/dashboard/*`)은 비로그인 시 렌더되지 않으므로
로그아웃 사용자가 하트를 보는 곳은 아래 둘뿐이다.

- `src/components/ContentCardActions.tsx` — 콘텐츠 카드 하단 찜/담기 행 (`/explore`, `/contents`, 홈 추천 등 공개 화면)
- `src/app/contents/[id]/_components/ContentDetailView.tsx` — 상세 화면 우측 하트 버튼

`Header`의 찜 링크·카운트는 `status === "authenticated"` 블록 안이라 영향 없음.

## 방침 (사용자 결정)

**하트는 계속 표시하되 비활성으로 두고, 클릭하면 로그인으로 유도한다.**

- 비로그인(`status !== "authenticated"`): `active = false` 고정. localStorage 찜 데이터를 읽지 않는다.
- 하트 클릭 시 `/login?next=<현재 경로>`로 이동 (ItineraryClient의 `loginNext` 패턴과 동일).
- 로그인 상태: 기존 동작(추가/삭제) 그대로.

## 구현

### `src/hooks/useFavoriteHeart.ts` (신규)

찜 하트의 활성 상태와 토글 동작을 한곳에 모은 얇은 훅.

```ts
export function useFavoriteHeart(content: Content) {
  const { status } = useAuth();
  const { items, add, remove } = useFavorites();
  const router = useRouter();
  const pathname = usePathname();

  const authed = status === "authenticated";
  // 비로그인 시 로컬 찜 데이터를 무시하고 항상 비활성.
  const active = authed && items.some((c) => c.id === content.id);

  function toggle() {
    if (!authed) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (active) remove(content.id);
    else add(content);
  }

  return { active, toggle };
}
```

- `items.some(...)`는 기존 코드처럼 store의 `items` 배열을 직접 구독한 값으로 계산한다
  (React Compiler가 `isFavorited(id)` 호출을 순수 함수로 오인하는 문제 회피 — 기존 주석 참고).

### 호출부 교체

- `ContentCardActions.tsx`: `favorited`/`onClick` 계산을 `useFavoriteHeart`로 대체.
- `ContentDetailView.tsx`: 동일.

## 테스트

- `useFavoriteHeart.test.ts` 또는 `ContentCardActions.test.tsx`:
  - 비로그인 상태에서 찜한 적 있는 콘텐츠라도 `aria-pressed=false`
  - 비로그인 상태에서 하트 클릭 → `/login?next=` 로 push
  - 로그인 상태에서는 토글 동작
- 기존 `ContentDetailView.test.tsx` 회귀 확인

## 검증

```bash
bun run lint
bun run test
bun run build
```
