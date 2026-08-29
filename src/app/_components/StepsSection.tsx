import { JOURNEY_STEPS } from "@/lib/journey";

export function StepsSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
        세 단계로 끝나요
      </h2>
      <div className="mt-8 grid grid-cols-1 gap-4.5 sm:grid-cols-3">
        {JOURNEY_STEPS.map((step) => (
          <div
            key={step.n}
            className="rounded-xl border border-border bg-muted/40 p-6"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-base font-extrabold text-primary-foreground">
              {step.n}
            </span>
            <p className="mt-4 text-[17px] font-bold tracking-tight">
              {step.label}
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
