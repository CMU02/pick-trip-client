"use client";

import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { CONTENT_LIST_STALE_TIME } from "@/hooks/useLoadMoreContents";
import { parseApiError } from "@/lib/errors";
import { getContents } from "@/services/contentService";
import type { Content } from "@/types/content";
import type { Region } from "@/types/region";

interface AlternativePlacePickerProps {
  region: Region;
  travelDate: string;
  duration: number;
  onSelect: (content: Content) => void;
  onClose: () => void;
}

export function AlternativePlacePicker({
  region,
  travelDate,
  duration,
  onSelect,
  onClose,
}: AlternativePlacePickerProps) {
  // "대체" 버튼을 같은 지역·기간으로 여러 항목에서 연달아 누르면 캐시를
  // 재사용한다 — 예전엔 열 때마다 매번 새로 조회했다. 캐시 키는
  // ContentBrowser(useLoadMoreContents)의 ["contents", 조건, 페이지크기] 키와
  // 절대 겹치지 않도록 "alternative" 태그를 넣어 구분한다.
  const query = useQuery({
    queryKey: ["contents", "alternative", region, travelDate, duration],
    queryFn: () =>
      getContents({
        regions: [region],
        startDate: travelDate,
        nights: duration,
      }),
    staleTime: CONTENT_LIST_STALE_TIME,
  });

  return (
    <div
      data-testid="alternative-place-picker-overlay"
      className="fixed inset-0 z-50"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      <div className="absolute right-0 bottom-0 left-0 max-h-[70vh] rounded-t-2xl bg-card">
        <div className="flex justify-center py-2">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="flex items-center justify-between px-4 pb-3">
          <h2 className="font-semibold">대체 장소 선택</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-4 pb-6">
          {query.isLoading && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              불러오는 중...
            </p>
          )}
          {query.isError && (
            <p className="py-8 text-center text-sm text-destructive">
              {parseApiError(query.error).message}
            </p>
          )}
          {query.isSuccess && query.data.contents.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              추천할 대체 장소가 없습니다
            </p>
          )}
          {query.isSuccess && query.data.contents.length > 0 && (
            <ul className="flex flex-col gap-2">
              {query.data.contents.map((content) => (
                <li
                  key={content.id}
                  className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2"
                >
                  <p className="truncate text-sm font-medium">{content.name}</p>
                  <Button size="sm" onClick={() => onSelect(content)}>
                    이 장소로 교체
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
