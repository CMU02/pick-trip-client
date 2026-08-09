"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";

import { useBasket } from "@/hooks/useBasket";

import { BasketDrawer } from "./BasketDrawer";
import { BasketFab } from "./BasketFab";
import { BasketPanel } from "./BasketPanel";

interface BasketLayoutProps {
  children: ReactNode;
  // 바구니 콘텐츠가 2개 이상일 때 "AI 일정 생성" 클릭 시 이동할 경로.
  generateHref: string;
}

// 콘텐츠 그리드/카드 화면에 공통으로 붙는 바구니 UI(데스크톱 우측 패널 +
// 모바일 하단 FAB/드로어) 레이아웃. /contents, /dashboard/for-you, /favorites가 공유한다.
export function BasketLayout({ children, generateHref }: BasketLayoutProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { items, remove, setPriority, clear } = useBasket();
  const router = useRouter();

  const canGenerate = items.length >= 2;
  const onGenerate = () => router.push(generateHref);

  return (
    <>
      <div className="flex gap-6">
        <div className="min-w-0 flex-1">{children}</div>

        <aside className="hidden w-72 shrink-0 lg:block">
          <BasketPanel
            items={items}
            onRemove={remove}
            onSetPriority={setPriority}
            onClear={clear}
            canGenerate={canGenerate}
            onGenerate={onGenerate}
          />
        </aside>
      </div>

      <BasketFab count={items.length} onOpen={() => setIsDrawerOpen(true)} />
      <BasketDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        items={items}
        onRemove={remove}
        onSetPriority={setPriority}
        onClear={clear}
        canGenerate={canGenerate}
        onGenerate={onGenerate}
      />
    </>
  );
}
