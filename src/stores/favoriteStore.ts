import { create } from "zustand";

import type { Content } from "@/types/content";

const STORAGE_KEY = "pick-trip-favorites";

interface FavoriteState {
  items: Content[];
  // 초기 렌더는 빈 배열이고, 마운트 시 localStorage에서 1회 로드한다.
  hydrated: boolean;
  hydrate: () => void;
  add: (content: Content) => void;
  remove: (contentId: string) => void;
  isFavorited: (contentId: string) => boolean;
}

function persist(items: Content[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  items: [],
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: Content[] = JSON.parse(stored);
        set({ items: parsed });
      }
    } catch {
      // 손상된 데이터는 무시
    }
    set({ hydrated: true });
  },

  add: (content) => {
    const prev = get().items;
    if (prev.some((c) => c.id === content.id)) return;
    const next = [...prev, content];
    persist(next);
    set({ items: next });
  },

  remove: (contentId) => {
    const next = get().items.filter((c) => c.id !== contentId);
    persist(next);
    set({ items: next });
  },

  isFavorited: (contentId) => get().items.some((c) => c.id === contentId),
}));
