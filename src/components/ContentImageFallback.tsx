import { Icon } from "@/components/ui/icon";
import { CATEGORY_ICONS, type ContentCategory } from "@/types/content";

export type FallbackSize = "sm" | "md" | "lg" | "xl";

// 카테고리별 배경색은 두지 않는다 — 배경은 항상 같고 아이콘만 바뀐다.
const SIZE_MAP = {
  // ≤42px 썸네일: 원 없이 타일 배경 + 아이콘만
  sm: { circle: 0, icon: 19, ring: "" },
  md: {
    circle: 48,
    icon: 21,
    ring: "0 0 0 1px oklch(0.91 0.03 30), 0 0 0 6px oklch(0.97 0.02 30)",
  },
  lg: {
    circle: 62,
    icon: 26,
    ring: "0 0 0 1px oklch(0.91 0.03 30), 0 0 0 8px oklch(0.97 0.02 30)",
  },
  xl: {
    circle: 84,
    icon: 36,
    ring: "0 0 0 1px oklch(0.91 0.03 30), 0 0 0 10px oklch(0.97 0.02 30)",
  },
} as const;

interface Props {
  category?: ContentCategory | null;
  size?: FallbackSize;
  className?: string;
}

// imageUrl이 없거나 이미지 로드에 실패했을 때 이미지 영역을 채우는 플레이스홀더.
// 텍스트 없이 카테고리 아이콘만 보여준다(B안: 흰 면 + 원형 타일). 카테고리
// 값이 없거나 매핑에 없으면 관광지(compass) 아이콘으로 폴백한다.
export function ContentImageFallback({
  category,
  size = "lg",
  className,
}: Props) {
  const iconName =
    (category && CATEGORY_ICONS[category]) ?? CATEGORY_ICONS.ATTRACTION;
  const { circle, icon, ring } = SIZE_MAP[size];

  // 작은 썸네일: 원 없이 타일 배경 + 아이콘
  if (circle === 0) {
    return (
      <div
        aria-hidden
        className={`grid h-full w-full place-items-center ${className ?? ""}`}
        style={{
          background:
            "linear-gradient(160deg, oklch(0.975 0.02 30), oklch(0.95 0.04 32))",
        }}
      >
        <Icon
          name={iconName}
          size={icon}
          className="text-[oklch(0.7_0.12_30)]"
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className={`grid h-full w-full place-items-center bg-[oklch(0.99_0.006_30)] ${className ?? ""}`}
    >
      <div
        className="grid place-items-center rounded-full bg-white"
        style={{ width: circle, height: circle, boxShadow: ring }}
      >
        <Icon
          name={iconName}
          size={icon}
          className="text-[oklch(0.62_0.16_28)]"
        />
      </div>
    </div>
  );
}
