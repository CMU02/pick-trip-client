// ForYouCard의 텍스트 줄(제목/주소)이 차지하는 높이를 그대로 블록으로 잡아,
// 로딩 전후 레이아웃 시프트가 생기지 않게 한다. loading.tsx는 스트리밍 응답에
// 그대로 실려 크롤러에도 보이므로 더미 텍스트 대신 빈 블록을 쓴다.
function ForYouCardSkeleton() {
  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-xl border border-border"
      aria-hidden="true"
    >
      <div className="aspect-video animate-pulse bg-muted" />
      <div className="flex flex-col gap-2 p-4">
        <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

export default function ForYouLoading() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-14">
      <div className="flex gap-6">
        <div className="min-w-0 flex-1" aria-hidden="true">
          <div className="mb-6 flex flex-col gap-1.5">
            <div className="h-3.5 w-16 animate-pulse rounded bg-muted" />
            <div className="h-6 w-56 animate-pulse rounded bg-muted" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {["a", "b", "c", "d", "e", "f", "g", "h"].map((k) => (
              <ForYouCardSkeleton key={k} />
            ))}
          </div>
        </div>

        <aside className="hidden w-72 shrink-0 lg:block" aria-hidden="true">
          <div className="sticky top-4 rounded-xl border border-border bg-card p-4">
            <div className="mb-3 h-5 w-28 animate-pulse rounded bg-muted" />
            <div className="h-16 animate-pulse rounded-lg bg-muted" />
            <div className="mt-4 h-9 w-full animate-pulse rounded-4xl bg-muted" />
          </div>
        </aside>
      </div>
    </main>
  );
}
