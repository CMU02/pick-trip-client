import type { Metadata } from "next";

import { BasketPageClient } from "./_components/BasketPageClient";

export const metadata: Metadata = {
  title: "여행 바구니 | PickTrip",
};

// 바구니는 전적으로 클라이언트(localStorage) 상태라 서버에서 할 일이 없다.
export default function BasketPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10">
      <BasketPageClient />
    </main>
  );
}
