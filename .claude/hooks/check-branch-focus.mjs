#!/usr/bin/env node
import { execSync } from "node:child_process";

try {
  const branch = execSync("git rev-parse --abbrev-ref HEAD", {
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  }).trim();

  const match = branch.match(/^(feat|fix|refactor|docs|chore|hotfix)\/(.+)$/);
  if (!match) process.exit(0);

  const [, prefix, scope] = match;

  process.stdout.write(
    `[BRANCH-FOCUS] 현재 브랜치: ${branch} | 허용 범위: ${scope}\n` +
      `이 브랜치(${prefix}/${scope})에서는 '${scope}'와 관련된 작업만 진행합니다. ` +
      "다른 기능, 설정, 문서 작업이 필요하면 새 브랜치로 분리하세요.\n" +
      "세부 규칙: .agents/rules/branch-focus.md\n",
  );
} catch {
  process.exit(0);
}
