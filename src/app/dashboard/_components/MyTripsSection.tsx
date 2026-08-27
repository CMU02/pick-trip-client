"use client";

import Link from "next/link";

import { Icon } from "@/components/ui/icon";
import { useSavedItineraries } from "@/hooks/useSavedItineraries";
import { ALL_REGIONS_QUERY } from "@/types/region";

import { TripCard } from "./TripCard";

const PREVIEW_COUNT = 6;

export function MyTripsSection() {
  const { items, remove } = useSavedItineraries();

  return (
    <section className="flex h-full flex-col gap-4">
      <div className="flex items-end justify-between gap-5">
        <div className="flex items-center gap-2.5">
          <span className="h-[19px] w-1 rounded-full bg-primary" />
          <h2 className="text-[21px] font-bold tracking-tight text-foreground">
            내 여행
          </h2>
          <p className="text-xs font-semibold tracking-wide text-primary/60 uppercase">
            My Trip
          </p>
        </div>
        {items.length > PREVIEW_COUNT && (
          <Link
            href="/itineraries"
            className="text-sm font-bold text-primary hover:underline"
          >
            더보기 →
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2.5 rounded-[20px] border-[1.5px] border-dashed border-[oklch(0.88_0.055_30)] bg-[oklch(0.99_0.012_30)] py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent">
            <Icon
              name="bookmark"
              size={20}
              className="text-accent-foreground"
            />
          </span>
          <p className="text-[15px] font-bold text-foreground/80">
            아직 저장한 일정이 없습니다
          </p>
          <p className="text-[13px] text-muted-foreground">
            지역을 선택하면 첫 일정을 만들 수 있어요
          </p>
          <Link
            href={`/select/conditions?regions=${ALL_REGIONS_QUERY}`}
            className="mt-1.5 rounded-xl bg-accent px-5 py-3 text-[13.5px] font-bold text-accent-foreground transition-colors hover:bg-accent/80"
          >
            지역 선택하기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {items.slice(0, PREVIEW_COUNT).map((item) => (
            <TripCard key={item.itineraryId} item={item} onRemove={remove} />
          ))}
        </div>
      )}
    </section>
  );
}
