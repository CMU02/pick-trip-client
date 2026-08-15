"use client";

import {
  COMPANION_CONDITIONS,
  type CompanionCondition,
} from "@/types/travel-condition";

interface CompanionSelectorProps {
  value: CompanionCondition[];
  onChange: (value: CompanionCondition[]) => void;
}

export function CompanionSelector({ value, onChange }: CompanionSelectorProps) {
  function toggle(condition: CompanionCondition) {
    if (value.includes(condition)) {
      onChange(value.filter((c) => c !== condition));
    } else {
      onChange([...value, condition]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {COMPANION_CONDITIONS.map((c) => {
        const selected = value.includes(c.value);
        return (
          <button
            key={c.value}
            type="button"
            aria-pressed={selected}
            onClick={() => toggle(c.value)}
            className={
              selected
                ? "rounded-full border-[1.5px] border-primary bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground"
                : "rounded-full border-[1.5px] border-border bg-card px-4 py-2.5 text-[13px] font-semibold text-muted-foreground hover:border-primary/40"
            }
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
