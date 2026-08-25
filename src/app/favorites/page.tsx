import type { Metadata } from "next";

import { FavoritesClient } from "./_components/FavoritesClient";

// 사용자별 즐겨찾기 목록이라 검색 결과에 노출될 이유가 없다.
export const metadata: Metadata = {
  robots: { index: false },
};

export default function FavoritesPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-14">
      <FavoritesClient />
    </main>
  );
}
