"use client";

import { useEffect, useRef, useState } from "react";

export function CopyLinkBox() {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => {
    setUrl(window.location.href);
    return () => clearTimeout(copiedTimeoutRef.current);
  }, []);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    clearTimeout(copiedTimeoutRef.current);
    copiedTimeoutRef.current = setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mt-6 flex items-center gap-2 rounded-xl bg-white/15 p-1.5 pl-4">
      <span className="min-w-0 flex-1 truncate font-mono text-sm text-white/90">
        {url}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-[oklch(0.52_0.19_28)] transition-colors hover:bg-white/90"
      >
        {copied ? "복사됨" : "링크 복사"}
      </button>
    </div>
  );
}
