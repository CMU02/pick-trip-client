// 대시보드는 히어로/퀵카테고리/추천/내 여행/최근 본 콘텐츠 여러 섹션으로
// 이루어져 있어 각 섹션의 대략적인 자리만 블록으로 잡아 레이아웃 시프트를
// 줄인다(카드 하나하나를 정확히 복제하기보다 전체 뼈대 위주).
export default function DashboardLoading() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-14">
      <div className="flex flex-col gap-12" aria-hidden="true">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="h-[220px] animate-pulse rounded-[24px] bg-muted" />
          <div className="h-[220px] animate-pulse rounded-[20px] bg-muted" />
        </div>

        <div className="flex gap-2.5">
          {["a", "b", "c", "d", "e"].map((k) => (
            <div
              key={k}
              className="h-9 w-24 animate-pulse rounded-full bg-muted"
            />
          ))}
        </div>

        <div className="flex flex-col gap-3.5">
          <div className="h-5 w-32 animate-pulse rounded bg-muted" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {["a", "b", "c", "d"].map((k) => (
              <div
                key={k}
                className="aspect-video animate-pulse rounded-xl bg-muted"
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
