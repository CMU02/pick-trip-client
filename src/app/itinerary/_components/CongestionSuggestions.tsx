import { Icon } from "@/components/ui/icon";
import type { ItinerarySuggestion } from "@/types/itinerary";

// 혼잡 기반 순서변경 제안(suggestions[])의 안내 배너. 서버는 제안대로
// 재정렬하지 않으므로, "수락" 클릭 시 클라이언트가 직접 순서를 바꾼다
// (ItineraryClient.applyAcceptedSuggestions). 제안이 없거나 전부 수락됐으면
// 렌더하지 않는다.
export function suggestionKey(suggestion: ItinerarySuggestion): string {
  return `${suggestion.dayIndex}:${suggestion.contentId}:${suggestion.swapWithContentId ?? ""}`;
}

interface CongestionSuggestionsProps {
  suggestions: ItinerarySuggestion[];
  acceptedKeys: Set<string>;
  onAccept: (suggestion: ItinerarySuggestion) => void;
}

export function CongestionSuggestions({
  suggestions,
  acceptedKeys,
  onAccept,
}: CongestionSuggestionsProps) {
  const pending = suggestions.filter(
    (s) => !acceptedKeys.has(suggestionKey(s)),
  );
  if (pending.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <p className="flex items-center gap-1.5 text-[13px] font-bold text-amber-800">
        <Icon name="alert" size={14} className="shrink-0" />
        혼잡 시간대 순서 제안
      </p>
      <ul className="mt-2 space-y-2">
        {pending.map((suggestion) => {
          const key = suggestionKey(suggestion);
          return (
            <li
              key={key}
              className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-amber-900"
            >
              <span>{suggestion.message}</span>
              {suggestion.swapWithContentId && (
                <button
                  type="button"
                  onClick={() => onAccept(suggestion)}
                  className="shrink-0 rounded-full border border-amber-300 bg-white px-3 py-1 text-[12px] font-bold text-amber-800 transition-colors hover:bg-amber-100"
                >
                  순서 바꾸기
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
