export default function Loading() {
  return (
    <main className="min-h-full animate-pulse bg-[oklch(0.985_0.008_30)]">
      <section className="bg-gradient-to-br from-[oklch(0.63_0.2_30)] to-[oklch(0.53_0.2_16)] px-4 py-12">
        <div className="mx-auto max-w-[900px] space-y-4">
          <div className="h-5 w-24 rounded bg-white/20" />
          <div className="h-8 w-64 rounded bg-white/20" />
          <div className="h-4 w-48 rounded bg-white/20" />
          <div className="h-11 rounded-xl bg-white/15" />
        </div>
      </section>

      <div className="mx-auto max-w-[900px] space-y-3 px-4 py-8">
        <div className="h-24 rounded-2xl border border-border bg-muted" />
        <div className="h-24 rounded-2xl border border-border bg-muted" />
      </div>
    </main>
  );
}
