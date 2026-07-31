"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useBasket } from "@/hooks/useBasket";

import { ProgressStepper } from "./ProgressStepper";

export function DashboardHero() {
  const { user } = useAuth();
  const { items } = useBasket();

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="flex flex-col justify-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            안녕하세요, {user?.nickname}님 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            지금까지의 여행 준비 상황을 확인해보세요
          </p>
        </div>
        <ProgressStepper />
      </div>

      <Card>
        <CardContent className="flex h-full flex-col justify-between gap-4">
          <div>
            <p className="font-semibold text-foreground">
              {items.length === 0
                ? "아직 담긴 콘텐츠가 없어요"
                : `${items.length}개의 콘텐츠가 담겨 있어요`}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {items.length === 0
                ? "마음에 드는 콘텐츠를 담아 나만의 일정을 만들어보세요"
                : "콘텐츠를 더 담거나 AI 일정을 생성해보세요"}
            </p>
          </div>
          <Button asChild variant="destructive" className="w-full">
            <Link href="/explore">콘텐츠 둘러보기 &gt;</Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
