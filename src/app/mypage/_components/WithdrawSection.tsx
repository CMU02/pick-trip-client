"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

// 마이페이지 하단 위험 구역. radix dialog 의존성과 알려진 레이아웃 시프트를
// 피하려고 모달 대신 인라인 2단계 확인을 쓴다.
export function WithdrawSection() {
  const { withdraw } = useAuth();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleWithdraw() {
    setPending(true);
    setFailed(false);
    const ok = await withdraw();
    if (ok) {
      // 로그인 전용 화면에 남으면 재로그인을 유도하게 되므로 홈으로 보낸다.
      router.replace("/");
      return;
    }
    setPending(false);
    setFailed(true);
  }

  return (
    <section className="mt-6 rounded-[18px] border border-[oklch(0.9_0.05_25)] bg-[oklch(0.985_0.012_25)] p-5.5">
      <div className="flex items-center gap-2.5">
        <span className="h-[18px] w-1 rounded-full bg-destructive" />
        <h2 className="text-[19px] font-bold tracking-tight">회원 탈퇴</h2>
      </div>
      <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground">
        탈퇴해도 30일 안에 같은 소셜 계정으로 다시 로그인하면 계정이 복구됩니다.
        30일이 지나면 저장한 일정·바구니·찜이 모두 삭제됩니다.
      </p>

      {failed && (
        <p
          role="alert"
          className="mt-3 text-[13px] font-semibold text-destructive"
        >
          탈퇴 처리에 실패했습니다. 잠시 후 다시 시도해주세요.
        </p>
      )}

      {confirming ? (
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <span className="text-[13.5px] font-semibold text-foreground">
            정말 탈퇴하시겠어요?
          </span>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleWithdraw}
            disabled={pending}
          >
            {pending ? "처리 중..." : "탈퇴하기"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setConfirming(false)}
            disabled={pending}
          >
            취소
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="mt-4"
          onClick={() => {
            setConfirming(true);
            setFailed(false);
          }}
        >
          회원 탈퇴
        </Button>
      )}
    </section>
  );
}
