"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { parseApiError } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { createShare } from "@/services/shareService";

interface ShareButtonProps {
  itineraryId: string;
  // 공유 링크가 만들어진 뒤의 링크 입력 박스 래퍼에 얹을 클래스.
  // 일정 결과 화면처럼 넓게 보여줄 곳에서만 넘긴다.
  linkBoxClassName?: string;
}

type ShareState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "created"; shareUrl: string }
  | { status: "error"; message: string };

export function ShareButton({
  itineraryId,
  linkBoxClassName,
}: ShareButtonProps) {
  const { runAuthed } = useAuth();
  const [state, setState] = useState<ShareState>({ status: "idle" });
  const [copied, setCopied] = useState(false);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => {
    return () => clearTimeout(copiedTimeoutRef.current);
  }, []);

  async function handleShare() {
    setState({ status: "loading" });
    try {
      const { token } = await runAuthed((accessToken) =>
        createShare(itineraryId, accessToken),
      );
      // 응답의 shareUrl은 백엔드 설정(app.share.link-base-url)이 만들어 API
      // 도메인을 가리키기도 한다. 공유 화면은 프론트 라우트라 토큰으로 직접
      // 조립해야 어느 환경에서든 열리는 링크가 나온다.
      setState({
        status: "created",
        shareUrl: `${window.location.origin}/share/${token}`,
      });
    } catch (err) {
      setState({ status: "error", message: parseApiError(err).message });
    }
  }

  async function handleCopy(shareUrl: string) {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    clearTimeout(copiedTimeoutRef.current);
    copiedTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
  }

  if (state.status === "created") {
    return (
      <div className={cn("flex items-center gap-2", linkBoxClassName)}>
        <input
          readOnly
          value={state.shareUrl}
          aria-label="공유 링크"
          className="min-w-0 flex-1 rounded border border-border px-2 py-1 text-sm text-foreground"
        />
        <Button
          type="button"
          variant={copied ? "secondary" : "outline"}
          size="sm"
          onClick={() => handleCopy(state.shareUrl)}
          className={copied ? "text-primary" : undefined}
        >
          {copied ? "복사됨" : "복사"}
        </Button>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex items-center gap-2">
        <p className="text-sm text-destructive">{state.message}</p>
        <Button type="button" variant="outline" size="sm" onClick={handleShare}>
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      disabled={state.status === "loading"}
      onClick={handleShare}
    >
      {state.status === "loading" ? "생성 중..." : "공유하기"}
    </Button>
  );
}
