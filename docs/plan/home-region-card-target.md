# 홈 지역 카드 → 전체 지역 여행 조건 페이지로

## 문제

홈 `RegionShowcase`의 지역 카드(하동·영주·예천)는 각각
`/select/conditions?regions=<한 지역>`으로 이동한다. 그러면 여행 조건 페이지가
그 지역 하나로 고정되고(이 페이지에는 지역 선택 UI가 없다), 사용자가 다른 지역을
추가하지 못한다.

앱의 다른 진입점(`HeroSection`, `CtaSection`, `Header`, `DashStats`, `MyTripsSection`,
`ForYouClient`, `FavoritesClient`, 빈 바구니)은 이미 전부
`/select/conditions?regions=${ALL_REGIONS_QUERY}`로 보낸다. `RegionShowcase`만 예외다.

## 방침 (사용자 결정)

- **어느 지역 카드를 눌러도 `/select/conditions?regions=${ALL_REGIONS_QUERY}`로 이동**한다
  (버튼 → 여행 조건 페이지 흐름). 여행 조건 요약에는 "하동, 영주, 예천"으로 표시된다.
- 여행 조건 페이지에 지역 선택 UI를 새로 만들지는 않는다.
- 카드 그리드 열 수는 **현행 유지**(`grid-cols-1 sm:grid-cols-3`). 지역 카드는 3개뿐이라
  태블릿에서 2+1로 떨어지는 `/basket` breakpoint를 따라갈 이유가 없다.

## 구현

- `src/app/_components/RegionShowcase.tsx`
  - `href={`/select/conditions?regions=${region}`}` → `href={CONDITIONS_HREF}`
    (`CONDITIONS_HREF = `/select/conditions?regions=${ALL_REGIONS_QUERY}``)
  - 카드는 여전히 지역별 사진/설명을 보여주지만 이동 목적지는 동일하다.
  - 섹션 설명 문구가 "지역을 선택하면"이라 오해를 줄 수 있으면 소폭 조정.
- `src/app/_components/RegionShowcase.test.tsx`
  - href 기대값을 세 카드 모두 `ALL_REGIONS_QUERY`로 갱신.

## 범위 밖 (별도 판단)

`Footer`의 지역 링크도 `?regions=<한 지역>`을 쓴다. 같은 이유로 어색하지만,
이번 작업 범위(홈 카드)에는 넣지 않는다.

## 검증

```bash
bun run lint
bun run test
bun run build
```
