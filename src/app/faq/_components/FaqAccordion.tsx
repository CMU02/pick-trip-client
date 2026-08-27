"use client";

import { useId, useMemo, useState } from "react";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

import { FAQ_CATEGORIES, FAQS, type FaqTab } from "../_lib/faqs";

export function FaqAccordion() {
  const [tab, setTab] = useState<FaqTab>("전체");
  // 한 번에 하나만 연다. 최초 진입 시 첫 항목이 열려 있고,
  // 탭을 바꾸면 모두 닫는다.
  const [openId, setOpenId] = useState<string | null>(FAQS[0]?.id ?? null);
  const regionPrefix = useId();

  const items = useMemo(
    () => (tab === "전체" ? FAQS : FAQS.filter((faq) => faq.category === tab)),
    [tab],
  );

  function selectTab(next: FaqTab) {
    setTab(next);
    setOpenId(null);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {FAQ_CATEGORIES.map((category) => {
          const active = category === tab;
          return (
            <button
              key={category}
              type="button"
              aria-pressed={active}
              onClick={() => selectTab(category)}
              className={cn(
                "rounded-full px-4 py-[9px] text-[13px] font-bold transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "border border-[oklch(0.92_0.012_30)] bg-white text-[oklch(0.4_0.015_30)] hover:border-[oklch(0.85_0.05_30)]",
              )}
            >
              {category}
            </button>
          );
        })}
      </div>

      <ul className="mt-6 flex flex-col gap-[10px]">
        {items.map((faq) => {
          const open = openId === faq.id;
          const regionId = `${regionPrefix}-${faq.id}`;
          const buttonId = `${regionId}-trigger`;

          return (
            <li
              key={faq.id}
              className={cn(
                "rounded-[18px] border transition-colors",
                open
                  ? "border-[oklch(0.88_0.06_30)] bg-white"
                  : "border-[oklch(0.93_0.012_30)] bg-[oklch(0.994_0.004_30)]",
              )}
            >
              <button
                type="button"
                id={buttonId}
                aria-expanded={open}
                aria-controls={regionId}
                onClick={() => setOpenId(open ? null : faq.id)}
                className="flex w-full cursor-pointer items-start gap-3 px-[22px] py-[19px] text-left"
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-[26px] shrink-0 items-center justify-center rounded-[9px] text-[12px] font-extrabold transition-colors",
                    open
                      ? "bg-primary text-primary-foreground"
                      : "bg-[oklch(0.96_0.02_30)] text-[oklch(0.52_0.19_28)]",
                  )}
                >
                  Q
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-[15.5px] font-bold leading-[1.45] tracking-[-0.02em] text-pretty text-foreground">
                    {faq.question}
                  </span>
                  <span className="mt-1 block text-[11.5px] font-bold text-[oklch(0.55_0.06_30)]">
                    {faq.category}
                  </span>
                </span>

                <Icon
                  name="chevron-down"
                  size={17}
                  className={cn(
                    "mt-1 shrink-0 text-[oklch(0.5_0.015_30)] transition-transform duration-[180ms]",
                    open && "rotate-180",
                  )}
                />
              </button>

              {open ? (
                <section
                  id={regionId}
                  aria-labelledby={buttonId}
                  className="border-t border-[oklch(0.95_0.008_30)] pt-4 pr-[22px] pb-[22px] pl-[62px]"
                >
                  {faq.answer.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-[14px] leading-[1.75] text-pretty text-[oklch(0.4_0.015_30)] [&:not(:first-child)]:mt-3"
                    >
                      {paragraph}
                    </p>
                  ))}

                  {faq.link ? (
                    <a
                      href={faq.link.href}
                      {...(faq.link.external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      className="mt-4 inline-flex items-center gap-1 text-[13px] font-bold text-primary transition-colors hover:text-[oklch(0.52_0.19_28)]"
                    >
                      {faq.link.label}
                      {faq.link.external ? (
                        <Icon name="external-link" size={13} />
                      ) : null}
                    </a>
                  ) : null}
                </section>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
