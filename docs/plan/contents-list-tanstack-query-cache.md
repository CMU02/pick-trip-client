# 지역 콘텐츠 목록(/contents, /explore) TanStack Query 캐싱 최적화

## Context

- 대상: `ContentBrowser`(지역 탭 + 카드 그리드)를 쓰는 `/contents`, `/explore` 두 화면. 홈의
  `RegionShowcase`(지역 소개 카드 3장)는 정적 컴포넌트라 API 호출이 없어 이번 범위에서 제외한다.
- 지금 동작(`hooks/useLoadMoreContents.ts`): "전체" 탭(SSR 시드가 있는 조건)만
  `staleTime: Infinity`를 받고, 특정 지역 탭으로 바꾸면 시드가 없어
  `staleTime: undefined`(기본값 0)로 떨어진다. 즉 지역 탭을 한 번이라도 옮기면 그 탭은
  **다시 방문할 때마다** 캐시된 데이터를 보여주면서도 즉시 백그라운드 refetch를 건다 — "한
  번 호출하면 끝"이 아니라 탭 전환마다 네트워크가 나간다.
- 새로고침/재방문 시에는 인메모리 캐시 자체가 사라져 있어 완전히 새로 fetch한다(로컬
  스토리지 등 영속화가 없음).
- `pick-trip-server`(`ad69e13` `perf(content): TourAPI 상세 조회 캐시 적용`) 확인: 백엔드는
  상세 조회(`GET /api/v1/contents/{id}`)만 Caffeine으로 캐싱한다(`contentId` 키,
  `expireAfterWrite=24h`, `maximumSize=500`). 목록 조회(`GET /api/v1/contents?region=...`)는
  커밋 메시지에 "keyword 자유 입력으로 캐시 키 카디널리티가 높고 전체 콜의 7%에 불과해 이번
  범위에서 제외"라고 명시되어 있어 **의도적으로 서버 캐싱 대상이 아니다**. 목록 재조회를
  줄이는 몫은 프론트가 맡아야 한다는 뜻이고, TourAPI 상세 조회가 전체 호출의 93%를 차지한다는
  같은 조사 결과를 보면(목록 콜은 상대적으로 적지만 여전히 반복 호출 자체는 아낄 가치가 있음)
  프론트 캐싱도 같은 문제의식(TourAPI 일일 호출 한도 절약)의 연장선이다.

## 목표

1. **세션 내**: 같은 조건(지역 탭)을 다시 선택해도 네트워크 재호출 없이 캐시된 데이터를 바로
   보여준다.
2. **세션 간**(새로고침, 브라우저 재방문): 로컬 스토리지에 저장해둔 결과를 재사용해 첫
   화면부터 캐시로 그린다.
3. 데이터가 실제로 갱신되는 주기(콘텐츠 동기화 배치가 주 1회 — `content-load-more.md`,
   `ad69e13` 커밋 메시지 근거)를 감안해 적당히 긴 TTL을 두되 무한 캐시는 피한다.

## TanStack Query 공식 문서 기준 정리

- **staleTime** — "Setting staleTime is the recommended way to avoid excessive refetches."
  staleTime 동안은 마운트/포커스 등으로 재검증 트리거가 있어도 재요청하지 않는다. 기본값은
  `0`(즉시 stale), 비활성 쿼리의 gc 기본값은 5분.
  (https://tanstack.com/query/v5/docs/framework/react/guides/important-defaults)
- **로컬 스토리지 영속화**는 공식적으로 두 갈래다.
  - `PersistQueryClientProvider` + `createAsyncStoragePersister`
    (`@tanstack/react-query-persist-client` + `@tanstack/query-async-storage-persister`) —
    QueryClient 전체를 로컬스토리지 항목 하나로 직렬화/복원한다. 예전에 쓰던
    `createSyncStoragePersister`(`@tanstack/query-sync-storage-persister`)는 문서상 deprecated
    예정이라 async 버전이 권장된다.
    (https://tanstack.com/query/v5/docs/framework/react/plugins/persistQueryClient,
    https://tanstack.com/query/v5/docs/framework/react/plugins/createSyncStoragePersister)
  - `experimental_createQueryPersister`(`@tanstack/query-persist-client-core`) — 쿼리
    단위(쿼리 해시별)로 개별 저장/복원한다. `QueryClient`의
    `defaultOptions.queries.persister`로 전역 지정하거나, 개별 쿼리(또는
    `queryClient.setQueryDefaults(queryKeyPrefix, { persister })`)에 좁혀서 지정할 수 있다.
    (https://tanstack.com/query/v5/docs/framework/react/plugins/createPersister)
  - 공통 옵션: `maxAge`(캐시 유효 기간, 지나면 폐기), `buster`(문자열이 바뀌면 기존 캐시
    무효화), `gcTime`을 `maxAge` 이상으로 맞춰야 복원 전에 메모리에서 먼저 지워지지 않는다.

## 방침

- **`experimental_createQueryPersister`로 `["contents", ...]` 쿼리에만 좁혀서 적용한다.**
  `PersistQueryClientProvider`(QueryClient 전체 직렬화) 방식은 쓰지 않는다 — 같은
  QueryClient가 `useAuth`(인증 상태)와 `ItineraryClient`(일정 생성 결과) 쿼리도 관리하는데
  (`src/app/providers.tsx`), 이런 쿼리까지 로컬스토리지에 통째로 남기면 인증 관련 캐시가
  브라우저에 남거나 자주 바뀌는 일정 데이터가 오래된 채로 복원될 위험이 있다. 콘텐츠 목록만
  좁혀 저장하는 편이 목적에 맞고 더 안전하다.
- staleTime은 지역 탭 유무와 무관하게 고정값을 준다(현재는 시드 없는 탭만 0). 값은 우선
  보수적으로(예: 1시간) 잡고, 동기화 배치 주기(주 1회)를 감안해 필요하면 늘린다.
- 로컬 스토리지 저장분은 `maxAge`(예: 하루~수일)와 `buster`(예: 스키마 버전 문자열 또는
  `CONTENT_PAGE_SIZE` 등 캐시 형태가 바뀔 때 올릴 수 있는 상수)를 둔다.
- 상세 페이지(`/contents/[id]`)는 백엔드가 이미 24h Caffeine 캐시로 커버하고 있어 이번
  범위에서는 프론트 추가 캐싱을 하지 않는다(별도 판단 대상으로 남겨둠).

## 구현 단계

### 0. 패키지 설치

```bash
bun add @tanstack/query-persist-client-core
```

(`experimental_createQueryPersister`가 이 패키지에서 나온다. `react-query-persist-client`/
`query-async-storage-persister`는 QueryClient 전체 직렬화 방식이라 이번 방침에서는 설치하지
않는다.)

### 1. 세션 내 재호출 방지 — `src/hooks/useLoadMoreContents.ts`

- 현재: `staleTime: hasSeed ? Number.POSITIVE_INFINITY : undefined`.
- 변경: 시드 유무와 무관하게 고정 `staleTime`을 주는 상수(예: `CONTENT_LIST_STALE_TIME = 60 *
  60 * 1000`)를 도입해 `staleTime: hasSeed ? Number.POSITIVE_INFINITY :
  CONTENT_LIST_STALE_TIME`으로 바꾼다("전체" 탭은 SSR 시드가 있는 동안은 그대로 무한대 유지,
  나머지 지역 탭도 최소한 고정 TTL은 받게 한다).
- `useInfiniteQuery`라 각 페이지가 같은 staleTime을 공유한다 — "더보기"로 쌓인 페이지도 함께
  캐시 대상.
- 영향 범위 확인: `useLoadMoreContents.test.ts`(신규 케이스: 지역 탭 재선택 시 refetch 없음),
  `ContentBrowser` 관련 테스트.

### 2. 로컬 스토리지 영속화 — `src/app/providers.tsx` + `useLoadMoreContents.ts`

- `providers.tsx`의 `QueryClient` 생성 코드(현재 `useState`로 최초 1회만 초기화하는 지점) 안에서
  클라이언트 전용으로 persister를 만든다. Next.js SSR에서는 `window`가 없으므로 반드시
  `typeof window !== "undefined"` 가드 뒤에서 생성(또는 `useState` lazy init 콜백 안, 이미
  클라이언트 컴포넌트라 마운트 시점엔 window 존재).
- `experimental_createQueryPersister({ storage: window.localStorage, maxAge: ...,
  buster: ... })`로 persister를 만들고, 전역이 아니라
  `queryClient.setQueryDefaults(["contents"], { persister: persister.persisterFn })`로
  `contents` 접두어 쿼리에만 건다(`useLoadMoreContents`의 queryKey가 이미
  `["contents", effectiveParams, CONTENT_PAGE_SIZE]`라 접두어가 일치).
- `gcTime`은 `maxAge` 이상으로 맞춘다(문서상 복원 전에 gc로 먼저 지워지는 걸 막기 위함) —
  `useLoadMoreContents`의 `useInfiniteQuery` 옵션 또는 `setQueryDefaults`에서 함께 지정.
- QA 관점 확인 항목: (1) 로컬스토리지 비운 첫 진입엔 정상적으로 네트워크 호출, (2) 새로고침 시
  캐시에서 즉시 그려지고 staleTime 안이면 재요청 없음, (3) 만료(maxAge 경과) 후에는 캐시
  폐기하고 새로 요청, (4) `buster` 값을 바꿔보고 이전 캐시가 무시되는지 확인.

### 3. 검증

- `bun run lint`
- `bun run test`
- `bun run build`
- 수동 QA: Chrome DevTools Application 탭에서 로컬스토리지 키 생성 확인, Network 탭에서 같은
  지역 탭 재클릭 시 요청이 안 나가는지, 새로고침 후 캐시로 먼저 그려지는지 확인.

## 범위 밖 (별도 판단)

- 상세 페이지(`/contents/[id]`, `getContentById`) 프론트 캐싱: 백엔드가 이미 24h 캐싱 중이라
  이번 작업 범위에는 넣지 않는다.
- `useAuth`, `ItineraryClient` 등 다른 쿼리의 로컬스토리지 영속화: 민감하거나(인증) 자주
  바뀌는(일정 생성 결과) 데이터라 이번 범위에서 제외.
- 홈 `RegionShowcase`: API 호출이 없는 정적 컴포넌트라 캐싱 대상이 아님.
- 필터(카테고리)·검색어(`q`)는 여전히 클라이언트 사이드 필터라(`ContentBrowser`) 이미 불러온
  `contents` 배열에 적용된다 — 이번 캐싱 작업으로 서버 필터링 파라미터를 새로 추가하지 않는다.

## 리스크 / 고려사항

- 로컬스토리지 용량 제한(브라우저별로 보통 5~10MB). 무한 스크롤로 지역별×여러 페이지가
  쌓이면 커질 수 있다 — 우선 지역 탭 조합(전체/하동/영주/예천, 4종)만 있어 당장은 여유가
  있지만, 필터 조합이 늘어나면 재검토가 필요하다(예: 오래된 쿼리부터 정리하는 `busterCache`
  전략 또는 "최근 방문한 지역 탭만 저장" 등).
- staleTime을 길게 잡으면 사용자가 오래된 목록을 "최신"으로 오인할 수 있다 — 콘텐츠 동기화
  배치 주기(주 1회)보다는 충분히 짧게, 그러나 탭 전환마다 재요청하지 않을 만큼은 길게
  잡는다. 필요하면 명시적 새로고침 진입점(예: 목록 상단 "새로고침")을 별도 과제로 검토.
- `experimental_` 접두사가 붙은 API라 `@tanstack/react-query` 마이너 업그레이드 시 시그니처가
  바뀔 수 있다 — 업그레이드 시 회귀 테스트가 필요하다는 점을 CHANGELOG나 PR 설명에 남겨둔다.

## 구현 완료 메모 (2026-08-29)

- Step 0~2를 적용했다.
  - `package.json`: `@tanstack/query-persist-client-core` 추가, `@tanstack/react-query`를
    `^5.101.2` → `^5.102.8`로 올림(아래 이유).
  - `src/hooks/useLoadMoreContents.ts`: `CONTENT_LIST_STALE_TIME`(1시간) 도입, 시드 없는
    지역 탭도 이 값을 `staleTime`으로 받도록 변경.
  - `src/app/providers.tsx`: `experimental_createQueryPersister(window.localStorage,
    maxAge: 24h, buster: "contents-cache-v1")`를 만들어
    `queryClient.setQueryDefaults(["contents"], { persister, gcTime: 24h })`로 `contents`
    쿼리에만 좁혀 배선.
- **버전 정합성 이슈 발견·수정**: `@tanstack/query-persist-client-core`가 `@tanstack/query-core`를
  정확한 버전(`5.102.8`)에 고정 의존한다. 기존 `@tanstack/react-query`(`^5.101.2`, 실제 설치는
  `5.101.2`)는 그보다 낮은 `query-core`를 물고 있어, 두 패키지가 서로 다른 `query-core` 인스턴스를
  쓰게 되어 `tsc --noEmit`에서 `QueryClient` 타입 불일치(`#private` 필드 충돌)로 에러가 났다
  (`persister: persister.persisterFn`이 `setQueryDefaults` 옵션 타입에 대입 불가). 두 패키지가
  같은 `query-core`를 쓰도록 `@tanstack/react-query`를 `^5.102.8`로 맞춰 해결했다 — 이 세션은
  이 저장소가 있는 Windows 기기가 아니라 별도 Linux 브릿지 환경이라 `npm`으로 재설치를
  시도했으나 마운트된 `node_modules` 특성상 `ENOTEMPTY`로 실패했다(`baseline-browser-mapping`
  디렉터리 rename 실패, 대상과 무관). **`bun.lock`이 아직 최신 버전을 반영하지 못했으므로,
  로컬에서 `bun install`을 한 번 실행해 `node_modules`/`bun.lock`을 동기화해야 한다.**

## 남은 일 (로컬에서 실행 필요)

이 세션은 프로젝트가 있는 Windows 기기가 아닌 별도 Linux 브릿지 환경에서 동작했고, 그 환경에는
이 저장소가 bun으로 설치해둔 Windows 전용 네이티브 바이너리(biome.exe, tsc.exe, next의 swc 등)가
없어 `bun run lint`/`test`/`build`를 이 세션에서 직접 돌리지 못했다. 대신 순수 JS인 TypeScript
컴파일러로 `tsc --noEmit`은 돌려봤고(위 버전 불일치 에러 1건 외 추가 타입 에러 없음 확인),
나머지는 로컬에서 아래 순서로 확인이 필요하다.

```bash
bun install        # 위 버전 정합성 수정 반영 + node_modules/bun.lock 동기화
bun run lint
bun run test
bun run build
```

수동 QA(브라우저):
- `/contents` 또는 `/explore`에서 지역 탭을 A→B→A로 전환 — Network 탭에서 A로 돌아올 때
  요청이 안 나가는지 확인(1시간 staleTime 이내).
- 새로고침 후 DevTools Application 탭에서 `localStorage`에 `tanstack-query-*`(prefix
  기본값) 키가 생겼는지, 새로고침 시 첫 화면이 캐시로 바로 그려지는지 확인.
