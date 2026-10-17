"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useLayoutEffect, useMemo } from "react";
import { LOGIN_MARKER_COOKIE } from "@/lib/authCookies";
import { parseApiError } from "@/lib/errors";
import { FAVORITES_QUERY_KEY, SESSION_QUERY_KEY } from "@/lib/queryKeys";
import { apiClient } from "@/services/apiClient";
import { useBasketStore } from "@/stores/basketStore";
import type { UserMeResponse } from "@/types/auth";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface SessionResponse {
  accessToken: string | null;
  user: UserMeResponse | null;
}

interface AuthContextValue {
  status: AuthStatus;
  accessToken: string | null;
  user: UserMeResponse | null;
  refresh: () => Promise<string | null>;
  logout: () => Promise<void>;
  // 회원 탈퇴. 성공(true) 시 로컬 세션이 비워진다. 실패(false) 시 세션은 유지된다.
  withdraw: () => Promise<boolean>;
  runAuthed: <T>(fn: (token?: string) => Promise<T>) => Promise<T>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();

  // OAuth 콜백이 심은 1회용 표식이 있으면 방금 로그인한 것이므로, 비회원일 때
  // 담은 바구니(우선순위·체류시간 포함)를 비운다. 표식은 읽자마자 지운다.
  // layout effect라 자식의 바구니 hydrate(passive effect)·autoResume보다 먼저
  // 실행돼, 비워진 상태가 그대로 로드된다.
  useLayoutEffect(() => {
    const marker = `${LOGIN_MARKER_COOKIE}=`;
    if (!document.cookie.split("; ").some((c) => c.startsWith(marker))) return;
    // biome-ignore lint/suspicious/noDocumentCookie: 표식 쿠키 삭제는 동기 접근이 필요해 Cookie Store API 대신 쓴다
    document.cookie = `${marker}; max-age=0; path=/`;
    useBasketStore.getState().clear();
  }, []);

  // 세션은 서버 상태이므로 React Query로 캐싱한다. staleTime을 무한으로 두어
  // 명시적 refresh/logout이 있을 때만 갱신한다.
  const sessionQuery = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: async () => {
      const { data } = await apiClient.post<SessionResponse>("/auth/session");
      return data;
    },
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  });

  const accessToken = sessionQuery.data?.accessToken ?? null;
  const user = sessionQuery.data?.user ?? null;
  const status: AuthStatus = sessionQuery.isPending
    ? "loading"
    : accessToken
      ? "authenticated"
      : "unauthenticated";

  // 세션을 다시 조회하고 새 accessToken을 반환한다(없으면 null).
  const refresh = async (): Promise<string | null> => {
    const { data } = await sessionQuery.refetch();
    return data?.accessToken ?? null;
  };

  // 로그아웃은 실패해도 로컬 세션을 비우는 best-effort 정책을 유지한다.
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post("/auth/logout", null, {
        headers: accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : undefined,
      });
    },
    onSettled: () => {
      queryClient.setQueryData<SessionResponse>(SESSION_QUERY_KEY, {
        accessToken: null,
        user: null,
      });
      // 다음 로그인(다른 계정 포함) 때 이전 사용자의 찜 캐시가 재사용되지
      // 않도록 함께 비운다.
      queryClient.removeQueries({ queryKey: FAVORITES_QUERY_KEY });
    },
  });

  const logout = async (): Promise<void> => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // best-effort: 서버 로그아웃이 실패해도 onSettled에서 로컬 세션을 비운다.
    }
  };

  // 탈퇴 성공(ok:true)일 때만 로컬 세션을 비운다. 서버가 아직 회원으로
  // 두는 실패(ok:false)나 요청 자체 실패면 세션을 유지하고 false를 반환한다.
  const withdraw = async (): Promise<boolean> => {
    try {
      const { data } = await apiClient.post<{ ok: boolean }>("/auth/withdraw");
      if (!data?.ok) {
        return false;
      }
      queryClient.setQueryData<SessionResponse>(SESSION_QUERY_KEY, {
        accessToken: null,
        user: null,
      });
      queryClient.removeQueries({ queryKey: FAVORITES_QUERY_KEY });
      return true;
    } catch {
      return false;
    }
  };

  // 인증이 필요한 호출을 실행하고, AUTH_REQUIRED로 실패하면 세션을 갱신해
  // 새 토큰으로 1회만 재시도한다.
  const runAuthed = async <T,>(
    fn: (token?: string) => Promise<T>,
  ): Promise<T> => {
    try {
      return await fn(accessToken ?? undefined);
    } catch (err) {
      if (parseApiError(err).code !== "AUTH_REQUIRED") {
        throw err;
      }
      const fresh = await refresh();
      if (!fresh) {
        throw err;
      }
      return await fn(fresh);
    }
  };

  // refresh/logout/runAuthed는 매 렌더 새로 만들어지지만 accessToken/status/user가
  // 바뀔 때 value를 재계산하면 최신 상태를 클로저로 참조하므로 이 셋만 의존성에 둔다.
  // biome-ignore lint/correctness/useExhaustiveDependencies: 위 함수들은 최신 상태를 클로저로 캡처한다
  const value = useMemo<AuthContextValue>(
    () => ({ status, accessToken, user, refresh, logout, withdraw, runAuthed }),
    [status, accessToken, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth는 AuthProvider 내부에서만 사용할 수 있습니다");
  }
  return context;
}
