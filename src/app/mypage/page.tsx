import type { Metadata } from "next";

import { MyPageClient } from "./_components/MyPageClient";

// 로그인한 사용자 계정 화면이라 검색 결과에 노출될 이유가 없다.
export const metadata: Metadata = {
  robots: { index: false },
};

export default function MyPagePage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-14">
      <MyPageClient />
    </main>
  );
}
