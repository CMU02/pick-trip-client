// ExploreCard와 같은 비율(aspect-video 썸네일 + 텍스트 2줄 자리)로 맞춰, 로딩
// 전후 레이아웃 시프트가 생기지 않게 한다. loading.tsx는 스트리밍 응답에 그대로
// 실려 크롤러에도 보이므로 더미 텍스트 대신 빈 블록을 쓴다.
function ExploreCardSkeleton() {
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

export default function ExploreLoading() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10">
      <div className="flex flex-col gap-6">
        <div
          className="h-[168px] animate-pulse rounded-[24px] bg-muted"
          aria-hidden="true"
        />
        <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {["a", "b", "c", "d", "e", "f", "g", "h"].map((k) => (
            <ExploreCardSkeleton key={k} />
          ))}
        </div>
      </div>
    </main>
  );
}
