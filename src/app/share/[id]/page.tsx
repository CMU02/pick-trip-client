import type { Metadata } from "next";
import Link from "next/link";

import { ItineraryResult } from "@/app/itinerary/_components/ItineraryResult";
import { Button } from "@/components/ui/button";
import { getSharedItinerary } from "@/services/shareService";
import { REGION_LABELS } from "@/types/region";
import { CopyLinkBox } from "./_components/CopyLinkBox";

export const metadata: Metadata = {
  title: "공유된 일정 | Pick Trip",
};

interface SharePageProps {
  params: Promise<{ id: string }>;
}

export default async function SharePage({ params }: SharePageProps) {
  const { id: token } = await params;

  try {
    const data = await getSharedItinerary(token);
    const durationText =
      data.duration === 0
        ? "당일치기"
        : `${data.duration}박 ${data.duration + 1}일`;
    const placeCount = data.days.reduce(
      (sum, day) => sum + day.items.length,
      0,
    );

    return (
      <main className="min-h-full bg-[oklch(0.985_0.008_30)]">
        <section className="bg-gradient-to-br from-[oklch(0.63_0.2_30)] to-[oklch(0.53_0.2_16)] px-4 py-12 text-white">
          <div className="mx-auto max-w-[900px]">
            <p className="text-lg font-extrabold tracking-[-0.035em]">
              PickTrip
            </p>
            <span className="mt-4 inline-flex items-center rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
              공유된 일정 · 읽기 전용
            </span>
            <h1 className="mt-4 text-[34px] font-extrabold tracking-[-0.04em]">
              {data.title}
            </h1>
            <p className="mt-1.5 text-sm text-white/80">
              {REGION_LABELS[data.region]} · {data.travelDate} · {durationText}{" "}
              · {placeCount}곳
            </p>
            <CopyLinkBox />
          </div>
        </section>

        <div className="mx-auto max-w-[900px] px-4 py-8">
          <ItineraryResult data={data} />

          <div className="mt-8 rounded-2xl border border-[oklch(0.91_0.05_30)] bg-white p-6 text-center">
            <p className="text-base font-bold text-foreground">
              나도 이런 일정 만들어볼까요?
            </p>
            <Button asChild className="mt-4">
              <Link href="/">PickTrip 시작하기</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  } catch {
    return (
      <main className="flex min-h-full items-center justify-center bg-[oklch(0.985_0.008_30)] px-4 py-8">
        <div className="rounded-2xl border border-border bg-white p-8 text-center">
          <p className="text-sm text-destructive">
            유효하지 않거나 만료된 공유 링크입니다.
          </p>
        </div>
      </main>
    );
  }
}
