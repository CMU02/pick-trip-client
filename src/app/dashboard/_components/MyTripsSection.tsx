"use client";

import Link from "next/link";

import { Icon } from "@/components/ui/icon";
import { useSavedItineraries } from "@/hooks/useSavedItineraries";

import { TripCard } from "./TripCard";

const PREVIEW_COUNT = 6;

export function MyTripsSection() {
  const { items, remove } = useSavedItineraries();

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wide text-primary uppercase">
            My Trip
          </p>
          <h2 className="text-lg font-bold text-foreground">내 여행</h2>
        </div>
        {items.length > PREVIEW_COUNT && (
          <Link
            href="/itineraries"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            더보기 →
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
          <Icon name="bookmark" size={32} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            아직 저장한 일정이 없습니다
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.slice(0, PREVIEW_COUNT).map((item) => (
            <TripCard key={item.itineraryId} item={item} onRemove={remove} />
          ))}
        </div>
      )}
    </section>
  );
}
