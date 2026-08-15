import { Icon } from "@/components/ui/icon";

export function GeneratingState() {
  return (
    <div className="flex flex-col items-center gap-4.5 py-24 text-center">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <div className="absolute inset-0 animate-spin rounded-full border-[5px] border-primary/20 border-t-primary" />
        <Icon name="wand" size={24} className="text-primary" />
      </div>
      <div>
        <p className="text-[22px] font-bold tracking-tight text-foreground">
          AI가 일정을 생성하고 있습니다
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          약 30초 정도 소요될 수 있습니다
        </p>
      </div>
    </div>
  );
}
