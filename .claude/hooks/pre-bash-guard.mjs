#!/usr/bin/env node
import { readFileSync } from "node:fs";

let input = {};
try {
  input = JSON.parse(readFileSync(0, "utf8") || "{}");
} catch {
  process.exit(0);
}

const command = input?.tool_input?.command ?? "";
if (!command) process.exit(0);

const hasRemoveItemRecurseForce =
  /\bRemove-Item\b/i.test(command) &&
  /(?:^|\s)-Recurse(?:\s|$)/i.test(command) &&
  /(?:^|\s)-Force(?:\s|$)/i.test(command);

const warnings = [
  {
    pattern: /\bgit\s+push\b/,
    label: "git push - 명시적 지시 없이 원격 push 금지",
  },
  {
    pattern: /\bgit\s+push\b.*\s--force(?:\s|$)/,
    label: "git push --force - 원격 히스토리 파괴 위험",
  },
  {
    pattern: /\bgit\s+reset\s+--hard\b/,
    label: "git reset --hard - 작업 내역 삭제 위험",
  },
  {
    pattern: /\brm\s+-rf\b/i,
    label: "rm -rf - 파일 영구 삭제 위험",
  },
  {
    pattern: /__REMOVE_ITEM_RECURSE_FORCE__/,
    label: "Remove-Item -Recurse -Force - 파일 영구 삭제 위험",
  },
  {
    pattern: /\bgit\s+checkout\s+main\b|\bgit\s+switch\s+main\b/,
    label: "main 브랜치 전환 - branch-focus 규칙 확인 필요",
  },
  {
    pattern: /\b(npm|yarn|pnpm)\s+(install|add|remove)\b/,
    label: "Bun 프로젝트에서 npm/yarn/pnpm 패키지 명령 감지",
  },
  {
    pattern: /\.(env|env\.local|env\.production|env\.development)\b/i,
    label: "환경변수 파일 접근 - secret 노출/커밋 금지",
  },
];

const commandForMatching = hasRemoveItemRecurseForce
  ? `${command} __REMOVE_ITEM_RECURSE_FORCE__`
  : command;

const matched = warnings.filter(({ pattern }) =>
  pattern.test(commandForMatching),
);

if (matched.length > 0) {
  process.stdout.write(
    "[PRE-BASH-GUARD] 주의가 필요한 명령어 감지:\n" +
      matched.map(({ label }) => `  - ${label}`).join("\n") +
      "\n필요한 작업인지 확인하고, 위험 작업은 사용자 확인 후 진행하세요.\n",
  );
}
