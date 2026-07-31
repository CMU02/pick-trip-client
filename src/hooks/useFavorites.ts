"use client";

import { useEffect } from "react";

import { useFavoriteStore } from "@/stores/favoriteStore";

// 전역 찜 스토어를 구독하는 얇은 훅. 여러 컴포넌트 인스턴스가 상태를 공유한다.
export function useFavorites() {
  const hydrate = useFavoriteStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const items = useFavoriteStore((s) => s.items);
  const add = useFavoriteStore((s) => s.add);
  const remove = useFavoriteStore((s) => s.remove);
  const isFavorited = useFavoriteStore((s) => s.isFavorited);

  return { items, add, remove, isFavorited };
}
