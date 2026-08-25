// ContentDetailView와 같은 자리에 같은 크기의 블록만 놓아, 실제 상세 화면과
// 스켈레톤의 크기 비율이 로딩 전후로 어긋나지 않게(레이아웃 시프트가 생기지
// 않게) 맞춘다. loading.tsx는 스트리밍 응답에 그대로 실려 크롤러에도 보이므로
// 더미 텍스트 대신 빈 블록을 쓰고, 제목 자리에도 h1을 쓰지 않는다.
export default function ContentDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6" aria-hidden="true">
      <div className="mb-4 h-5 w-16 animate-pulse rounded bg-muted" />
      <div className="relative mb-6 aspect-video animate-pulse overflow-hidden rounded-xl bg-muted" />

      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="h-6 w-48 animate-pulse rounded bg-muted" />
        <div className="h-5 w-16 shrink-0 animate-pulse rounded-full bg-muted" />
      </div>

      <div className="mb-1 h-5 w-32 animate-pulse rounded bg-muted" />
      <div className="mb-6 h-10 animate-pulse rounded bg-muted" />

      <div className="mb-6 flex flex-col gap-3 rounded-xl border border-border p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: 스켈레톤 고정 목록
          <div key={i} className="flex gap-2">
            <div className="h-5 w-28 shrink-0 animate-pulse rounded bg-muted" />
            <div className="h-5 flex-1 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>

      <div className="h-9 w-full animate-pulse rounded-4xl bg-muted" />
    </div>
  );
}
