#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

let input = {};
try {
  input = JSON.parse(readFileSync(0, "utf8") || "{}");
} catch {
  process.exit(0);
}

const filePath =
  input?.tool_input?.file_path ??
  input?.tool_input?.path ??
  input?.tool_input?.notebook_path ??
  "";

if (!filePath || !existsSync(filePath)) process.exit(0);

const normalizedPath = filePath.replaceAll("\\", "/");
const isSourceFile = /\.(tsx|ts|jsx|js)$/.test(normalizedPath);
const isConfigOrEnv = /(^|\/)(next\.config\.ts|package\.json|\.env.*)$/.test(
  normalizedPath,
);

let content = "";
try {
  content = readFileSync(filePath, "utf8");
} catch {
  process.exit(0);
}

const violations = [];

if (/\/(node_modules|\.next)\//.test(`/${normalizedPath}`)) {
  violations.push("node_modules 또는 .next 산출물 직접 편집 금지");
}

if (
  /\bNEXT_PUBLIC_[A-Z0-9_]*(SECRET|TOKEN|PASSWORD|PRIVATE|JWT|KEY)\b/.test(
    content,
  )
) {
  violations.push(
    "NEXT_PUBLIC_* 환경변수명에 SECRET/TOKEN/PASSWORD/JWT/KEY 포함 감지 - 브라우저 노출 여부 확인 필요",
  );
}

if (/dangerouslySetInnerHTML/.test(content)) {
  violations.push("dangerouslySetInnerHTML 사용 감지 - XSS 위험 검토 필요");
}

if (isSourceFile) {
  const hasUseClient =
    /^["']use client["'];?/.test(content.trimStart()) ||
    /^["']use client["']\n/.test(content.trimStart());
  const usesClientOnlyFeature =
    /\b(useState|useEffect|useReducer|useRef|useContext)\b/.test(content) ||
    /\b(window|document|localStorage|sessionStorage|navigator)\b/.test(
      content,
    ) ||
    /\bon[A-Z][A-Za-z]+\s*=/.test(content);

  if (usesClientOnlyFeature && !hasUseClient) {
    violations.push(
      '클라이언트 전용 기능 감지 - 필요한 경우 파일 최상단에 "use client"를 추가하세요',
    );
  }

  if (
    hasUseClient &&
    /process\.env\.(?!NEXT_PUBLIC_)[A-Z0-9_]+/.test(content)
  ) {
    violations.push(
      "Client Component에서 비공개 process.env 사용 감지 - NEXT_PUBLIC_ 외 값은 서버에서만 사용하세요",
    );
  }
}

if (
  isConfigOrEnv &&
  /(SECRET|TOKEN|PASSWORD|PRIVATE_KEY|JWT_SECRET)\s*=/.test(content)
) {
  violations.push("secret 형태 값 감지 - Git 커밋 대상에 포함하지 마세요");
}

if (violations.length > 0) {
  process.stdout.write(
    `[POST-WRITE-LINT] ${filePath} 컨벤션 경고:\n` +
      violations.map((violation) => `  - ${violation}`).join("\n") +
      "\n관련 문서: .agents/rules/code-convention.md, AGENTS.md\n",
  );
}
