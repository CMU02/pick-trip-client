import { create } from "zustand";

import type { Content } from "@/types/content";

const STORAGE_KEY = "pick-trip-recent-views";
const MAX_ITEMS = 10;

export interface RecentView {
  content: Content;
  viewedAt: number;
}

interface RecentViewsState {
  items: RecentView[];
  // 초기 렌더는 빈 배열이고, 마운트 시 localStorage에서 1회 로드한다.
  hydrated: boolean;
  hydrate: () => void;
  addView: (content: Content) => void;
}

function persist(items: RecentView[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const useRecentViewsStore = create<RecentViewsState>((set, get) => ({
  items: [],
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: RecentView[] = JSON.parse(stored);
        set({ items: parsed });
      }
    } catch {
      // 손상된 데이터는 무시
    }
    set({ hydrated: true });
  },

  addView: (content) => {
    const prev = get().items.filter((v) => v.content.id !== content.id);
    const next = [{ content, viewedAt: Date.now() }, ...prev].slice(
      0,
      MAX_ITEMS,
    );
    persist(next);
    set({ items: next });
  },
}));
