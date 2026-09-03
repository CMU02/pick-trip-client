"use client";

import { experimental_createQueryPersister } from "@tanstack/query-persist-client-core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AuthProvider } from "@/hooks/useAuth";

// 지역 콘텐츠 목록(["contents", ...] 쿼리)만 로컬 스토리지에 영속화한다. 인증
// 캐시(useAuth)나 일정 생성 결과(ItineraryClient) 같은 다른 쿼리는 민감하거나
// 자주 바뀌는 데이터라 이번 캐싱 대상에서 제외한다 — QueryClient 전체를
// 직렬화하는 PersistQueryClientProvider 대신, "contents" 쿼리에만 좁혀 붙일 수
// 있는 experimental_createQueryPersister를 쓰는 이유가 이거다.
// (docs/plan/contents-list-tanstack-query-cache.md 참고)
const CONTENTS_CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 하루 — 콘텐츠 동기화 배치가 주 1회라 넉넉함
const CONTENTS_CACHE_BUSTER = "contents-cache-v1"; // 캐시 스키마가 바뀌면 이 값을 올려 이전 캐시를 무효화한다

// React Query와 인증 컨텍스트를 클라이언트 경계에서 한 번에 배선한다.
export function Providers({ children }: { children: React.ReactNode }) {
  // 렌더마다 QueryClient가 재생성되지 않도록 최초 1회만 초기화한다.
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false, refetchOnWindowFocus: false },
      },
    });

    // SSR에는 window/localStorage가 없다. 이 초기화 콜백은 서버 렌더 중에도
    // 한 번 실행되므로(그 결과는 버려지고 클라이언트 하이드레이션 때 다시
    // 실행됨) 방어적으로 가드한다.
    if (typeof window !== "undefined") {
      const contentsPersister = experimental_createQueryPersister({
        storage: window.localStorage,
        maxAge: CONTENTS_CACHE_MAX_AGE,
        buster: CONTENTS_CACHE_BUSTER,
      });

      client.setQueryDefaults(["contents"], {
        persister: contentsPersister.persisterFn,
        // 로컬 스토리지 유효 기간(maxAge)보다 인메모리 gcTime이 짧으면 복원되기
        // 전에 메모리 캐시가 먼저 지워질 수 있다 — maxAge 이상으로 맞춘다.
        gcTime: CONTENTS_CACHE_MAX_AGE,
      });
    }

    return client;
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
