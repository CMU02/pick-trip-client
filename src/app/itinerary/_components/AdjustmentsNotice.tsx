import { Icon } from "@/components/ui/icon";

// "AI가 일정을 이렇게 조정했어요" 안내. 스케줄러가 AI 안을 바꾼 경우에만
// generate 응답에 담겨 온다(빈 배열이면 렌더하지 않는다).
export function AdjustmentsNotice({ adjustments }: { adjustments: string[] }) {
  if (adjustments.length === 0) return null;

  return (
    <div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
      <p className="flex items-center gap-1.5 text-[13px] font-bold text-primary">
        <Icon name="wand" size={14} className="shrink-0" />
        AI가 일정을 이렇게 조정했어요
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] text-foreground/80">
        {adjustments.map((adjustment) => (
          <li key={adjustment}>{adjustment}</li>
        ))}
      </ul>
    </div>
  );
}
