import { Icon, type IconName } from "@/components/ui/icon";

// "어떤 순서로 쓰는가"가 아니라 "AI가 무엇을 보고 순서를 정하는가"를 보여준다.
// 우측 일정 카드는 정적 예시다 — API를 호출하지 않고, "예시" 배지로 실제
// 사용자 일정과 구분한다. (JOURNEY_STEPS 상수는 대시보드 ProgressStepper·생성
// 흐름 "Step N"이 계속 쓰므로 지우지 않는다. 홈에서만 안 쓰게 된 것.)

const CRITERIA: { icon: IconName; title: string; desc: string }[] = [
  {
    icon: "pin",
    title: "이동 거리",
    desc: "가까운 곳끼리 묶어 하루 동선을 짧게 만듭니다",
  },
  {
    icon: "calendar",
    title: "운영 시간",
    desc: "문 여는 시간에 맞춰 방문 순서를 정합니다",
  },
  {
    icon: "restaurant-outline",
    title: "식사 시간",
    desc: "점심·저녁 시간대에 음식 콘텐츠를 배치합니다",
  },
];

const DEMO_ITEMS: {
  time: string;
  name: string;
  reason: string;
  leg: string | null;
}[] = [
  {
    time: "10:00",
    name: "최참판댁",
    reason: "오전에 사람이 적어 여유롭게 둘러볼 수 있습니다",
    leg: "차로 12분",
  },
  {
    time: "12:30",
    name: "고하버거 하동본점",
    reason: "점심 시간대에 맞춰 배치했습니다",
    leg: "차로 18분",
  },
  {
    time: "15:00",
    name: "십리벚꽃길",
    reason: "오후 햇빛에 사진이 잘 나오는 구간입니다",
    leg: null,
  },
];

export function HowItWorksSection() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16">
      <div className="grid items-center gap-14 rounded-3xl border border-[oklch(0.94_0.02_30)] bg-[oklch(0.98_0.014_32)] p-8 sm:p-12 lg:grid-cols-[1fr_1.05fr]">
        <div>
          <p className="text-[11.5px] font-extrabold tracking-[0.14em] text-primary">
            HOW IT WORKS
          </p>
          <h2 className="mt-3 text-3xl leading-tight font-bold tracking-tight sm:text-[38px] sm:tracking-[-0.045em]">
            담아둔 순서가 아니라
            <br />
            다닐 수 있는 순서로
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
            문 여는 시간, 장소 사이 거리, 식사 시간대를 함께 봅니다. 마음에 안
            드는 곳은 빼고 다시 만들 수 있습니다.
          </p>

          <ul className="mt-6 flex flex-col gap-3">
            {CRITERIA.map((row) => (
              <li key={row.title} className="flex items-start gap-3.5">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[9px] border border-[oklch(0.92_0.03_30)] bg-white text-primary">
                  <Icon name={row.icon} size={15} />
                </span>
                <div>
                  <p className="text-sm font-bold">{row.title}</p>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
                    {row.desc}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[26px] border border-border bg-white p-6 shadow-[0_2px_6px_oklch(0.4_0.03_30_/_0.04),0_24px_52px_oklch(0.4_0.03_30_/_0.08)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-[11px] bg-primary text-[13px] font-extrabold text-primary-foreground">
                1
              </span>
              <span className="text-[17px] font-bold tracking-tight">
                1일차
              </span>
              <span className="text-[12.5px] text-muted-foreground">
                9월 12일 (토)
              </span>
            </div>
            <span className="rounded-full bg-[oklch(0.955_0.04_30)] px-2.5 py-1 text-[11px] font-extrabold text-primary">
              예시
            </span>
          </div>

          <ol className="mt-4.5">
            {DEMO_ITEMS.map((item, index) => (
              <li key={item.name}>
                <div className="grid grid-cols-[52px_24px_1fr] items-start gap-3">
                  <div className="pt-px text-right text-[14.5px] font-bold text-primary">
                    {item.time}
                  </div>
                  <div className="flex flex-col items-center self-stretch">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-primary bg-[oklch(0.955_0.04_30)] text-[10.5px] font-extrabold text-primary">
                      {index + 1}
                    </span>
                    {index < DEMO_ITEMS.length - 1 && (
                      <span className="mt-1 w-0.5 flex-1 bg-[oklch(0.93_0.02_30)]" />
                    )}
                  </div>
                  <div className="pb-1.5">
                    <p className="text-[14.5px] font-bold tracking-tight">
                      {item.name}
                    </p>
                    <p className="mt-1.5 flex items-start gap-1.5 rounded-[11px] bg-[oklch(0.975_0.012_30)] px-3 py-2.5">
                      <span className="shrink-0 pt-0.5 text-[10px] font-extrabold tracking-wide text-primary">
                        AI
                      </span>
                      <span className="text-xs leading-relaxed text-muted-foreground">
                        {item.reason}
                      </span>
                    </p>
                  </div>
                </div>
                {item.leg && (
                  <div className="grid grid-cols-[52px_24px_1fr] items-center gap-3">
                    <div />
                    <div className="flex justify-center">
                      <span className="h-6 w-0.5 bg-[oklch(0.93_0.02_30)]" />
                    </div>
                    <div>
                      <span className="rounded-full border border-[oklch(0.94_0.012_30)] bg-[oklch(0.975_0.012_30)] px-2.5 py-1 text-[11.5px] font-bold text-muted-foreground">
                        {item.leg}
                      </span>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
