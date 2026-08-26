"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useAuth } from "@/hooks/useAuth";
import { useBasket } from "@/hooks/useBasket";
import { useItineraryEditor } from "@/hooks/useItineraryEditor";
import { useSavedItineraries } from "@/hooks/useSavedItineraries";
import { type ParsedApiError, parseApiError } from "@/lib/errors";
import {
  addBasketItem,
  getBasket,
  removeBasketItem,
  updateBasketConditions,
} from "@/services/basketService";
import { generateItinerary, saveItinerary } from "@/services/itineraryService";
import type { BasketItem } from "@/types/basket";
import { BASKET_PRIORITY_TO_SERVER } from "@/types/basket";
import type {
  ItineraryGenerateResponse,
  ItineraryResponse,
  SaveItineraryRequest,
} from "@/types/itinerary";
import { REGION_LABELS, type Region } from "@/types/region";
import {
  COMPANION_CONDITION_TO_SERVER,
  type CompanionCondition,
} from "@/types/travel-condition";
import { ErrorState } from "./ErrorState";
import { GeneratingState } from "./GeneratingState";
import { ItineraryResult } from "./ItineraryResult";
import { ShareButton } from "./ShareButton";
import { TripSummary } from "./TripSummary";

function formatDuration(nights: number) {
  return nights === 0 ? "당일치기" : `${nights}박 ${nights + 1}일`;
}

// 핸드오프 스펙(9번 "일정 결과")의 "STEP 3 · 일정 완성" 헤더 +
// 1fr/320px 레이아웃(일차 카드 | 여행 요약 사이드바)을 감싸는 래퍼.
// "이동 거리 합계" 카드는 서버가 이동 거리 데이터를 내려주지 않아 뺐다
// (핸드오프 README도 데이터 없으면 빼도 된다고 명시).
function ItineraryResultLayout({
  region,
  duration,
  actions,
  children,
  sidebar,
}: {
  region: Region;
  duration: number;
  actions: ReactNode;
  children: ReactNode;
  sidebar: ReactNode;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold tracking-widest text-primary/70 uppercase">
            Step 3 · 일정 완성
          </p>
          <h1 className="mt-2.5 text-[32px] font-extrabold tracking-tight">
            {REGION_LABELS[region]} {formatDuration(duration)} 일정
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">{actions}</div>
      </div>

      {/* items-start를 빼면(기본값 stretch) 사이드바 칼럼 자체가 일차 카드
          목록과 같은 높이(그리드 행 높이)로 늘어난다. sticky는 그 안쪽의
          별도 wrapper에 걸어서, 늘어난 칼럼 높이 안에서만 스크롤을 따라다니고
          칼럼 바닥(=일정 목록 하단)을 넘어가면 자연히 멈춘다 — "최소 높이는
          일정 목록에 맞추되 sticky 동작은 유지" 요청에 맞춘 구조. */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">{children}</div>
        <div>
          {/* ItineraryResult의 "생성된 일정" 제목(text-lg font-bold) + mt-4를
              보이지 않게 그대로 재현해, 여행 요약 카드가 그 제목이 아니라
              바로 아래 일차 카드 박스와 같은 높이에서 시작하게 한다. sticky
              박스 밖에 둬서, 스크롤로 실제 고정될 때는 이 여백 없이
              top-[86px]에 바로 붙는다. */}
          <div
            aria-hidden="true"
            className="invisible hidden text-lg font-bold text-foreground lg:block"
          >
            생성된 일정
          </div>
          <div className="flex flex-col gap-3.5 lg:mt-4 lg:sticky lg:top-[86px]">
            {sidebar}
          </div>
        </div>
      </div>
    </div>
  );
}

type ItineraryPhase =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "preview";
      data: ItineraryGenerateResponse;
      error?: ParsedApiError;
    }
  | { status: "loginPreview"; data: ItineraryGenerateResponse }
  | { status: "saving"; data: ItineraryGenerateResponse }
  | { status: "saved"; data: ItineraryResponse }
  | { status: "error"; message: string; code?: string; traceId?: string };

// 로그인 기능이 아직 구현되지 않아 generate가 401 AUTH_REQUIRED를 반환하는 동안,
// 결과 화면 UX를 확인할 수 있도록 바구니 콘텐츠로 로컬 미리보기 데이터를 만든다.
function buildLoginPreviewItinerary(
  items: BasketItem[],
  region: Region,
  startDate: string,
  nights: number,
): ItineraryGenerateResponse {
  const dayCount = nights + 1;
  // 백엔드는 dayIndex를 1부터 채번하므로(DayCard.tsx 참고) 미리보기도 동일하게 맞춘다.
  const days = Array.from({ length: dayCount }, (_, i) => ({
    dayId: `preview-day-${i}`,
    dayIndex: i + 1,
    items: [] as ItineraryGenerateResponse["days"][number]["items"],
  }));

  items.forEach((item, index) => {
    const day = days[index % dayCount];
    day.items.push({
      itemId: `preview-item-${index}`,
      contentId: item.content.id,
      title: item.content.name,
      order: day.items.length,
      reason: "담아주신 콘텐츠를 기반으로 만든 미리보기 일정입니다.",
      pinned: item.priority === "MUST",
    });
  });

  return {
    title: "미리보기 일정",
    region,
    travelDate: startDate,
    duration: nights,
    days,
  };
}

function SavedItineraryPanel({ data }: { data: ItineraryResponse }) {
  const editor = useItineraryEditor({
    itineraryId: data.itineraryId,
    title: data.title,
    region: data.region,
    travelDate: data.travelDate,
    duration: data.duration,
    initialDays: data.days,
  });

  return (
    <ItineraryResultLayout
      region={data.region}
      duration={data.duration}
      actions={<ShareButton itineraryId={data.itineraryId} />}
      sidebar={
        <section className="rounded-[20px] border border-border bg-card p-5.5">
          <h2 className="text-[17px] font-bold tracking-tight text-foreground">
            여행 요약
          </h2>
          <dl className="mt-4 flex flex-col gap-2.5 text-[13.5px]">
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted-foreground">지역</dt>
              <dd className="text-right font-bold text-foreground">
                {REGION_LABELS[data.region]}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted-foreground">기간</dt>
              <dd className="text-right font-bold text-foreground">
                {formatDuration(data.duration)}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted-foreground">담은 콘텐츠</dt>
              <dd className="text-right font-bold text-foreground">
                {editor.days.reduce((sum, day) => sum + day.items.length, 0)}개
              </dd>
            </div>
          </dl>
        </section>
      }
    >
      <p className="text-sm font-semibold text-primary">
        일정이 저장되었습니다.
      </p>
      <ItineraryResult
        data={data}
        editor={{
          region: data.region,
          travelDate: data.travelDate,
          duration: data.duration,
          days: editor.days,
          isDirty: editor.isDirty,
          isSaving: editor.isSaving,
          saveError: editor.saveError,
          onMoveItem: editor.moveItem,
          onRemoveItem: editor.removeItem,
          onTogglePinned: editor.togglePinned,
          onReplaceItem: editor.replaceItem,
          onSave: editor.save,
        }}
      />
    </ItineraryResultLayout>
  );
}

interface ItineraryClientProps {
  regions: string;
  startDate: string;
  nights: string;
  companions: string;
}

export function ItineraryClient({
  regions,
  startDate,
  nights,
  companions,
}: ItineraryClientProps) {
  const [phase, setPhase] = useState<ItineraryPhase>({ status: "idle" });
  const [titleDraft, setTitleDraft] = useState<string | null>(null);
  const { items, clear: clearBasket } = useBasket();
  const { add: addSavedItinerary } = useSavedItineraries();
  const { runAuthed } = useAuth();

  const parsedRegions = regions.split(",").filter(Boolean) as Region[];
  const parsedNights = Number(nights) || 0;
  const parsedCompanions = companions
    .split(",")
    .filter(Boolean) as CompanionCondition[];
  const loginNext = `/itinerary?${new URLSearchParams({ regions, startDate, nights, companions }).toString()}`;

  // 생성 시퀀스(조건 동기화 → 바구니 반영 → generate)를 runAuthed로 감싸,
  // AUTH_REQUIRED가 나면 내부에서 토큰 재발급 후 1회 재시도한다.
  const generateMutation = useMutation({
    mutationFn: () =>
      runAuthed(async (token) => {
        // generate는 요청 바디를 받지 않고 서버에 저장된 바구니/조건을 읽어 생성하므로,
        // 호출 전에 현재 바구니/조건을 서버에 반영한다.
        await updateBasketConditions(
          {
            region: parsedRegions[0],
            travelDate: startDate,
            duration: parsedNights,
            companions: parsedCompanions.map(
              (c) => COMPANION_CONDITION_TO_SERVER[c],
            ),
          },
          token,
        );

        // 로컬 바구니가 유일한 "진짜" 상태이고, 서버 바구니는 generate 직전에만
        // 로컬과 맞춰주는 일회용 스냅샷이다. addBasketItem만 반복 호출하면
        // 서버 쪽엔 과거 세션에서 추가된 항목이 지워지지 않고 영구히 쌓여서(서버는
        // 삭제 API를 따로 호출해야만 지워짐), 지금 로컬엔 없는 콘텐츠까지
        // generate에 딸려 들어가는 문제가 있었다(예: 예전에 담았다 뺀 콘텐츠가
        // 중복으로 재등장). 그래서 여기서 서버 바구니를 조회해 로컬과 diff를 떠서
        // 로컬에 없는 항목은 지우고, 서버에 없는 항목만 추가한다.
        const serverBasket = await getBasket(token);
        const localContentIds = new Set(items.map((item) => item.content.id));
        const serverContentIds = new Set(
          serverBasket.items.map((item) => item.contentId),
        );

        for (const serverItem of serverBasket.items) {
          if (localContentIds.has(serverItem.contentId)) continue;
          await removeBasketItem(serverItem.itemId, token);
        }

        for (const item of items) {
          if (serverContentIds.has(item.content.id)) continue;
          try {
            await addBasketItem(
              {
                contentId: item.content.id,
                priority:
                  BASKET_PRIORITY_TO_SERVER[item.priority ?? "OPTIONAL"],
                title: item.content.name,
                ...(item.content.imageUrl
                  ? { thumbnailUrl: item.content.imageUrl }
                  : {}),
              },
              token,
            );
          } catch (err) {
            const parsed = parseApiError(err);
            if (parsed.code !== "BASKET_ITEM_DUPLICATE") throw err;
          }
        }

        return generateItinerary(token);
      }),
  });

  // 저장도 runAuthed로 감싼다. 재발급 후에도 AUTH_REQUIRED면 최종 실패로 취급한다.
  const saveMutation = useMutation({
    mutationFn: (request: SaveItineraryRequest) =>
      runAuthed((token) => saveItinerary(request, token)),
  });

  function handleGenerate() {
    if (phase.status === "loading") return;

    setPhase({ status: "loading" });

    generateMutation.mutate(undefined, {
      // 이 시점 바구니 내용은 이미 서버 바구니로 반영돼 AI 생성에 쓰였으니
      // 로컬 바구니(장바구니)는 비운다 — 담아둔 콘텐츠가 생성 후에도 그대로
      // 남아있던 문제를 해결한다.
      onSuccess: (data) => {
        clearBasket();
        setPhase({ status: "preview", data });
      },
      onError: (err) => {
        const { message, code, traceId } = parseApiError(err);
        // runAuthed가 이미 재발급+재시도를 1회 했으므로, 여기 도달한 AUTH_REQUIRED는
        // 재발급까지 실패한 최종 상태다 → 로그인 안내 미리보기로 전환한다.
        if (code === "AUTH_REQUIRED") {
          const data = buildLoginPreviewItinerary(
            items,
            parsedRegions[0],
            startDate,
            parsedNights,
          );
          setPhase({ status: "loginPreview", data });
          return;
        }
        setPhase({ status: "error", message, code, traceId });
      },
    });
  }

  function handleSave(title: string) {
    if (phase.status !== "preview") return;
    const previewData = phase.data;

    setPhase({ status: "saving", data: previewData });

    const request: SaveItineraryRequest = {
      title,
      region: previewData.region,
      travelDate: previewData.travelDate,
      duration: previewData.duration,
      days: previewData.days.map((day) => ({
        dayIndex: day.dayIndex,
        items: day.items.map((item) => ({
          contentId: item.contentId,
          title: item.title,
          order: item.order,
          reason: item.reason,
          pinned: item.pinned ?? false,
        })),
      })),
    };

    saveMutation.mutate(request, {
      onSuccess: (saved) => {
        addSavedItinerary({
          itineraryId: saved.itineraryId,
          title: saved.title,
          region: saved.region,
          travelDate: saved.travelDate,
          duration: saved.duration,
          savedAt: Date.now(),
        });
        setTitleDraft(null);
        setPhase({ status: "saved", data: saved });
      },
      onError: (err) => {
        const parsed = parseApiError(err);
        setPhase({ status: "preview", data: previewData, error: parsed });
      },
    });
  }

  if (phase.status === "saved") {
    return (
      <SavedItineraryPanel key={phase.data.itineraryId} data={phase.data} />
    );
  }

  if (phase.status === "loginPreview") {
    return (
      <ItineraryResultLayout
        region={phase.data.region}
        duration={phase.data.duration}
        actions={
          <>
            <Button asChild>
              <Link href={`/login?next=${encodeURIComponent(loginNext)}`}>
                로그인하고 계속하기
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => setPhase({ status: "idle" })}
            >
              다시 생성
            </Button>
          </>
        }
        sidebar={
          <p className="rounded-[20px] border border-primary/30 bg-primary/5 p-5 text-sm text-primary">
            지금 보시는 일정은 담아주신 콘텐츠를 기반으로 만든 예시입니다.
            로그인하면 실제 AI 일정 생성/저장 기능을 이용할 수 있어요.
          </p>
        }
      >
        <ItineraryResult data={phase.data} />
      </ItineraryResultLayout>
    );
  }

  if (phase.status === "preview" || phase.status === "saving") {
    const isSaving = phase.status === "saving";
    return (
      <ItineraryResultLayout
        region={phase.data.region}
        duration={phase.data.duration}
        actions={
          titleDraft === null ? (
            <>
              <Button
                variant="outline"
                disabled={isSaving}
                onClick={() => setPhase({ status: "idle" })}
              >
                다시 생성
              </Button>
              <Button
                disabled={isSaving}
                onClick={() => setTitleDraft(phase.data.title)}
              >
                저장
              </Button>
            </>
          ) : (
            <form
              className="flex flex-wrap gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const trimmed = titleDraft.trim();
                if (!trimmed) return;
                handleSave(trimmed);
              }}
            >
              <label htmlFor="itinerary-title" className="sr-only">
                일정명
              </label>
              <input
                id="itinerary-title"
                className="w-40 rounded-md border border-input px-3 py-2 text-sm sm:w-56"
                value={titleDraft}
                disabled={isSaving}
                onChange={(e) => setTitleDraft(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                disabled={isSaving}
                onClick={() => setTitleDraft(null)}
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={isSaving || titleDraft.trim() === ""}
              >
                {isSaving ? "저장 중..." : "저장하기"}
              </Button>
            </form>
          )
        }
        sidebar={
          <TripSummary
            regions={parsedRegions}
            startDate={startDate}
            nights={parsedNights}
            companions={parsedCompanions}
            items={items}
            showItemList={false}
          />
        }
      >
        {phase.status === "preview" && phase.error && (
          <p className="text-sm text-destructive">
            {phase.error.message}
            {phase.error.traceId && ` (참고: ${phase.error.traceId})`}
          </p>
        )}
        <ItineraryResult data={phase.data} />
      </ItineraryResultLayout>
    );
  }

  return (
    // 생성 결과(ItineraryResultLayout)는 1fr/320px 2단 레이아웃이라 헤더
    // 너비(max-w-7xl)를 그대로 채우지만, 생성 전 요약 카드는 항목이 몇 줄뿐이라
    // 그대로 펼치면 라벨-값 간격만 늘어져 보인다. 이 단계만 좁게 가운데 정렬한다.
    <div className="mx-auto max-w-xl space-y-4">
      <TripSummary
        regions={parsedRegions}
        startDate={startDate}
        nights={parsedNights}
        companions={parsedCompanions}
        items={items}
      />

      {phase.status === "loading" && <GeneratingState />}
      {phase.status === "error" && (
        <ErrorState
          message={phase.message}
          traceId={phase.traceId}
          onRetry={handleGenerate}
        />
      )}

      <div className="space-y-2">
        {items.length < 2 && phase.status === "idle" && (
          <p className="text-sm text-muted-foreground">
            2개 이상 담아야 일정을 생성할 수 있어요
          </p>
        )}
        <Button
          disabled={phase.status === "loading" || items.length < 2}
          onClick={handleGenerate}
        >
          <Icon name="wand" size={16} />
          일정 생성하기
        </Button>
      </div>
    </div>
  );
}
