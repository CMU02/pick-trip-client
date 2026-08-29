// ExploreCard와 같은 썸네일 비율(aspect-[4/3]) + 텍스트 2~3줄로 맞춰, 로딩 전후
// 레이아웃 시프트가 생기지 않게 한다.
function ExploreCardSkeleton() {
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
