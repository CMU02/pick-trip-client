// ForYouCard와 같은 썸네일 비율(aspect-[4/3]) + 텍스트 3줄 + 액션 버튼으로 맞춰,
// 로딩 전후 레이아웃 시프트가 생기지 않게 한다.
function ForYouCardSkeleton() {
  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-[18px] border border-border"
      aria-hidden="true"
    >
      <div className="aspect-[4/3] animate-pulse bg-muted" />
      <div className="flex flex-col gap-1.5 p-4 pb-2">
        <h3 className="w-2/3 animate-pulse rounded bg-muted text-[14.5px] font-bold tracking-tight text-transparent">
          콘텐츠 이름
        </h3>
        <p className="w-1/2 animate-pulse rounded bg-muted text-xs text-transparent">
          주소
        </p>
        <p className="line-clamp-2 animate-pulse rounded bg-muted text-sm text-transparent">
          콘텐츠 요약 설명이 두 줄 정도 이어지는 형태로 표시되는 자리표시자
          문구입니다. 실제 카드와 높이 비율을 맞추기 위한 더미 텍스트입니다.
        </p>
      </div>
      <div className="mt-auto p-4 pt-2">
        <div className="mt-1 h-8 w-full animate-pulse rounded-4xl bg-muted" />
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
