import Link from "next/link";

import { HOME_COLLECTIONS } from "@/lib/collections";

// 테마 묶음을 가로 구분선 리스트로 보여준다(홈에 카드 섹션이 이미 셋이라
// 시각적으로 구분한다). 행을 누르면 /explore?ids=… 로 그 콘텐츠만 넘긴다.
// contentIds가 아직 안 채워진 컬렉션은 숨기고, 전부 비어 있으면 섹션을
// 통째로 렌더하지 않는다.
export function CollectionsSection() {
  const collections = HOME_COLLECTIONS.filter((c) => c.contentIds.length > 0);
  if (collections.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 pt-20">
      <p className="text-[11.5px] font-extrabold tracking-[0.14em] text-primary">
        COLLECTIONS
      </p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-[38px] sm:tracking-[-0.045em]">
        테마로 묶어 담기
      </h2>

      <ul className="mt-6 border-t border-[oklch(0.92_0.012_30)]">
        {collections.map((collection, index) => (
          <li key={collection.slug}>
            <Link
              href={`/explore?ids=${collection.contentIds.join(",")}`}
              className="grid grid-cols-[52px_1fr_auto] items-center gap-4 border-b border-[oklch(0.94_0.012_30)] px-2 py-[26px] transition-colors hover:bg-[oklch(0.985_0.012_30)] sm:grid-cols-[76px_1fr_auto] sm:gap-6"
            >
              <span className="text-[30px] font-extrabold tracking-tight text-[oklch(0.68_0.11_30)]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>
                <span className="block text-lg font-bold tracking-tight sm:text-[22px]">
                  {collection.title}
                </span>
                <span className="mt-1.5 block text-[13.5px] text-muted-foreground">
                  {collection.desc}
                </span>
              </span>
              <span className="flex items-center gap-4">
                <span className="rounded-full bg-[oklch(0.968_0.012_30)] px-3.5 py-1.5 text-xs font-bold text-muted-foreground">
                  {collection.contentIds.length}곳
                </span>
                <span className="text-lg font-bold text-primary">→</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
