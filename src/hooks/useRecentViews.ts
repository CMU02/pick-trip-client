"use client";

import { useEffect } from "react";

import { useRecentViewsStore } from "@/stores/recentViewsStore";

// 전역 최근 본 콘텐츠 스토어를 구독하는 얇은 훅.
export function useRecentViews() {
  const hydrate = useRecentViewsStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const items = useRecentViewsStore((s) => s.items);
  const addView = useRecentViewsStore((s) => s.addView);

  return { items, addView };
}
