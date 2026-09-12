"use client";

import { useState } from "react";

import { DayMapPanel } from "@/app/itinerary/_components/DayMapPanel";
import { DayTabs } from "@/app/itinerary/_components/DayTabs";
import { ItineraryResult } from "@/app/itinerary/_components/ItineraryResult";
import { useItineraryMapData } from "@/hooks/useItineraryMapData";
import { cn } from "@/lib/utils";
import type { ItineraryResponse } from "@/types/itinerary";
import type { ItineraryMapData } from "@/types/map";

// DayTabs의 실제 텍스트/색은 안 보이므로(invisible) 계산 없이 빈 맵으로 충분하다.
const EMPTY_MAP_DAYS_BY_INDEX = new Map<
  number,
  ItineraryMapData["days"][number]
>();

interface Props {
  data: ItineraryResponse;
  mapData?: ItineraryMapData;
}

// 저장한 일정 펼친 상세: 왼쪽 일정 타임라인(ItineraryResult, hideMap) + 오른쪽
// sticky 지도(DayMapPanel). 일차 선택 상태는 여기가 소유해서 양쪽에 같이 넘긴다.
// 공유하기 버튼은 여기 없다 — 목록 행 헤더의 "보기" 버튼 옆(SavedItinerariesList)에
// 항상 떠 있어서, 펼치지 않아도 바로 공유할 수 있다.
export function SavedItineraryDetail({ data, mapData }: Props) {
  const [dayIndex, setDayIndex] = useState(0);
  // 지도 확대 상태. grid가 아니라 flex-wrap을 써서, 지도 폭이 커져 같은 줄에
  // 더 이상 안 들어가면 왼쪽 일정 콘텐츠가 CSS만으로 자연스럽게 다음 줄로
  // 내려간다(별도 JS 애니메이션 없음).
  const [mapExpanded, setMapExpanded] = useState(false);
  // 스냅샷이 있으면 라이브 해석을 건너뛴다(ItineraryResult와 같은 규칙).
  const liveMapData = useItineraryMapData(mapData ? [] : data.days);
  const resolved = mapData ?? liveMapData;

  return (
    <div className="flex flex-wrap items-start gap-5">
      <div
        className={cn(
          "min-w-0 flex-1 basis-[300px]",
          mapExpanded ? "order-2" : "order-1",
        )}
      >
        <ItineraryResult
          data={data}
          mapData={resolved}
          selectedDayIndex={dayIndex}
          onSelectDay={setDayIndex}
          hideMap
        />
      </div>

      <div
        className={cn(
          "shrink-0 transition-[width] duration-300 ease-in-out",
          mapExpanded ? "order-1" : "order-2",
        )}
        style={{ width: mapExpanded ? "100%" : "380px" }}
      >
        {/* 접힌(사이드바) 상태에서만 왼쪽 ItineraryResult의 일차 탭 행
            (min-h-[45px] + mt-4)을 미러링하는 투명 스페이서로 지도 상단을
            "1일차" 카드에 맞춘다. 확대 상태에선 지도가 자기 줄을 통째로
            차지하니 필요 없다. */}
        {!mapExpanded && (
          <div aria-hidden="true" className="hidden lg:block">
            <div className="invisible flex min-h-[45px] flex-wrap items-center gap-3">
              <DayTabs
                days={data.days}
                mapDaysByIndex={EMPTY_MAP_DAYS_BY_INDEX}
                selectedIndex={dayIndex}
                onSelect={() => {}}
              />
            </div>
            <div className="h-4" />
          </div>
        )}

        <div
          className={cn(
            "flex flex-col gap-2.5",
            !mapExpanded && "lg:sticky lg:top-[86px]",
          )}
        >
          <DayMapPanel
            days={data.days}
            mapData={resolved}
            selectedDayIndex={dayIndex}
            expandable={{
              expanded: mapExpanded,
              onToggle: () => setMapExpanded((v) => !v),
            }}
          />
          {resolved.days.some((d) => d.route) && (
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              이동 시간·거리는 카카오 모빌리티 자동차 길찾기 실제 도로
              기준입니다. 순서를 바꾸면 다시 계산돼요.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
