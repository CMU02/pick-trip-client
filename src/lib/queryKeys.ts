// React Query 쿼리 키를 한곳에서 관리한다. useAuth/useFavorites가 서로를
// import하면 순환참조가 생기므로 두 훅이 공유하는 키는 이 파일에 둔다.
export const SESSION_QUERY_KEY = ["auth", "session"] as const;
export const FAVORITES_QUERY_KEY = ["favorites"] as const;
// add/remove 뮤테이션에 붙이는 키. useFavorites() 호출부(카드마다 하나씩)가
// 서로 다른 useMutation 인스턴스를 갖더라도, useIsMutating이 mutationKey로
// 전역 뮤테이션 캐시를 조회해 "같은 콘텐츠에 대한 요청이 지금 진행 중인지"를
// 훅 인스턴스와 무관하게 판단할 수 있게 한다(useFavoriteHeart 참고).
export const FAVORITES_ADD_MUTATION_KEY = ["favorites", "add"] as const;
export const FAVORITES_REMOVE_MUTATION_KEY = ["favorites", "remove"] as const;
