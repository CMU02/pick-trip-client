const STEPS = [
  {
    n: 1,
    title: "지역과 날짜 선택",
    desc: "가고 싶은 지역과 출발일, 기간을 고릅니다.",
  },
  {
    n: 2,
    title: "콘텐츠 담기",
    desc: "마음에 드는 장소를 바구니에 담고 우선순위를 정합니다.",
  },
  {
    n: 3,
    title: "AI 일정 생성",
    desc: "이동 거리와 운영 시간을 고려한 일정이 만들어집니다.",
  },
] as const;

export function StepsSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
        세 단계로 끝나요
      </h2>
      <div className="mt-8 grid grid-cols-1 gap-4.5 sm:grid-cols-3">
        {STEPS.map((step) => (
          <div
            key={step.n}
            className="rounded-xl border border-border bg-muted/40 p-6"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-base font-extrabold text-primary-foreground">
              {step.n}
            </span>
            <p className="mt-4 text-[17px] font-bold tracking-tight">
              {step.title}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {step.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
