// 홈 "HOW?" 캐러셀(HowItWorksSection)의 단계별 화면 캡쳐를 생성한다.
//
// 기존 public/how/step-*.png 는 브라우저 devicePixelRatio 0.9 환경에서 저해상도로
// 찍혀 1600px 로 늘린 것이라 텍스트가 뭉개졌다. 이 스크립트는 Playwright 로
// deviceScaleFactor 2 렌더 → 2배 밀도로 캡쳐 → sharp 로 1920x1200(16:10)
// Lanczos 다운스케일해 선명한 PNG 를 만든다.
//
// 사용법 (로컬 dev 서버가 떠 있어야 함: bun run dev):
//   node scripts/capture-how.mjs            # 4단계 모두
//   node scripts/capture-how.mjs 1 2 3      # 특정 단계만
//   BASE_URL=http://localhost:3001 node scripts/capture-how.mjs
//
// 4단계(AI 일정 결과)는 로그인 + 백엔드 생성이 필요하다. 로그인 세션은
// .pw-how-profile/ 에 저장되며(gitignored), 세션이 없으면 스크립트가 창을
// 띄운 채로 로그인을 기다린다 — 그 창에서 소셜 로그인을 직접 완료하면 된다.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const OUT_DIR = path.join(ROOT, "public", "how");
const RAW_DIR = path.join(ROOT, ".tmp-how-raw");
const PROFILE_DIR = path.join(ROOT, ".pw-how-profile");

const OUT_W = 1920;
const OUT_H = 1200; // 16:10

// 모든 단계가 공유하는 여행 조건. 4단계 결과 제목은 첫 지역(하동)으로 나온다.
const REGIONS = "HADONG,YEONGJU,YECHEON";
const NIGHTS = "1";
const COMPANIONS = "WITH_KIDS";
// 오늘로부터 넉넉히 미래인 출발일 (달력·조건 표시에 쓰인다).
const START_DATE = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 28);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
})();

const COND_QS = new URLSearchParams({
  regions: REGIONS,
  startDate: START_DATE,
  nights: NIGHTS,
  companions: COMPANIONS,
}).toString();

const wanted = process.argv.slice(2).map(Number).filter(Boolean);
const shouldRun = (n) => wanted.length === 0 || wanted.includes(n);

const log = (...a) => console.log("[capture-how]", ...a);

// 뷰포트(1440x900 CSS = dSF2 로 2880x1800 device)를 그대로 찍어
// 1920x1200(16:10) Lanczos 다운스케일. 사이트 헤더/푸터는 숨겨 화면 본문만 담는다.
async function shot(page, name) {
  fs.mkdirSync(RAW_DIR, { recursive: true });
  const raw = path.join(RAW_DIR, `${name}.png`);
  await page.addStyleTag({
    content: `
      header, footer { display: none !important; }
      nextjs-portal { display: none !important; }
      html, body { scroll-behavior: auto !important; }
      *::-webkit-scrollbar { width: 0 !important; height: 0 !important; display: none !important; }
      html { scrollbar-width: none !important; }
    `,
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
  await page.screenshot({
    path: raw,
    clip: { x: 0, y: 0, width: 1440, height: 900 },
  });
  const out = path.join(OUT_DIR, `${name}.png`);
  await sharp(raw)
    .resize(OUT_W, OUT_H, { kernel: "lanczos3" })
    .png({ compressionLevel: 9 })
    .toFile(out);
  log(`saved ${path.relative(ROOT, out)}`);
}

async function isAuthed(page) {
  try {
    const res = await page.request.post(`${BASE_URL}/auth/session`);
    const body = await res.json();
    return Boolean(body?.accessToken);
  } catch {
    return false;
  }
}

// 3·4단계는 바구니에 2개 이상 있어야 "일정 생성하기"가 활성화된다.
// 단계를 개별 실행해도 동작하도록, 부족하면 /contents 에서 담기 버튼을 누른다.
async function ensureBasket(page, min = 4) {
  await page.goto(`${BASE_URL}/contents?${COND_QS}`, {
    waitUntil: "domcontentloaded",
  });
  const count = await page.evaluate(() => {
    try {
      return JSON.parse(localStorage.getItem("pick-trip-basket") ?? "[]")
        .length;
    } catch {
      return 0;
    }
  });
  if (count >= min) {
    log(`basket already has ${count} items`);
    return;
  }
  const addButtons = page.getByRole("button", { name: "담기", exact: true });
  await addButtons.first().waitFor({ timeout: 20000 });
  for (let i = 0; i < min - count; i++) {
    await page
      .getByRole("button", { name: "담기", exact: true })
      .first()
      .click();
    await page.waitForTimeout(300);
  }
  await page.waitForTimeout(500);
}

async function main() {
  fs.mkdirSync(PROFILE_DIR, { recursive: true });
  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    locale: "ko-KR",
    args: ["--hide-scrollbars"],
  });
  const page = ctx.pages()[0] ?? (await ctx.newPage());
  page.setDefaultTimeout(20000);

  // ── 1. 여행 조건 ──────────────────────────────────────────────
  if (shouldRun(1)) {
    log("step 1: 여행 조건");
    await page.goto(`${BASE_URL}/select/conditions`, {
      waitUntil: "domcontentloaded",
    });
    // 달력을 START_DATE 의 연·월로 넘긴 뒤 그 날짜를 클릭 → 다른 단계와 조건 일치.
    const [y, m, d] = START_DATE.split("-").map(Number);
    const targetHeading = `${y}년 ${m}월`;
    for (let i = 0; i < 6; i++) {
      if (await page.getByText(targetHeading, { exact: true }).count()) break;
      await page.getByRole("button", { name: "다음 달" }).click();
      await page.waitForTimeout(200);
    }
    await page
      .getByRole("button", { name: String(d), exact: true })
      .first()
      .click();
    await page.getByRole("button", { name: "1박 2일", exact: true }).click();
    await page
      .getByRole("button", { name: "아이와 함께", exact: true })
      .click();
    await page.waitForTimeout(500);
    await shot(page, "step-1");
  }

  // ── 2. 콘텐츠 담기 ────────────────────────────────────────────
  if (shouldRun(2)) {
    log("step 2: 콘텐츠 담기");
    await ensureBasket(page, 4);
    await shot(page, "step-2");
  }

  // ── 3. AI 일정 생성 (생성 전 화면) ───────────────────────────
  if (shouldRun(3)) {
    log("step 3: AI 일정 생성 (생성 전)");
    await ensureBasket(page, 4);
    await page.goto(`${BASE_URL}/itinerary?${COND_QS}`, {
      waitUntil: "domcontentloaded",
    });
    await page
      .getByRole("button", { name: /일정 생성하기/ })
      .first()
      .waitFor({ timeout: 15000 });
    await page.waitForTimeout(800);
    await shot(page, "step-3");
  }

  // ── 4. AI 일정 결과 ──────────────────────────────────────────
  if (shouldRun(4)) {
    log("step 4: AI 일정 결과");
    await ensureBasket(page, 4);
    await page.goto(`${BASE_URL}/itinerary?${COND_QS}`, {
      waitUntil: "domcontentloaded",
    });

    if (!(await isAuthed(page))) {
      log("── 로그인 필요 ──────────────────────────────────────");
      log("열린 브라우저 창에서 소셜 로그인을 완료해 주세요.");
      log(
        "(로그인 세션은 .pw-how-profile/ 에 저장돼 다음 실행부터는 생략됩니다.)",
      );
      await page.goto(
        `${BASE_URL}/login?next=${encodeURIComponent(`/itinerary?${COND_QS}`)}`,
      );
      const waitMin = Number(process.env.LOGIN_WAIT_MIN ?? 20);
      const deadline = Date.now() + waitMin * 60 * 1000;
      let authed = false;
      while (Date.now() < deadline) {
        await page.waitForTimeout(3000);
        if (await isAuthed(page)) {
          authed = true;
          break;
        }
      }
      if (!authed) {
        throw new Error(
          `로그인 대기 시간 초과 (${waitMin}분). 다시 실행해 주세요.`,
        );
      }
      log("로그인 확인됨.");
    }

    await page.goto(`${BASE_URL}/itinerary?${COND_QS}`, {
      waitUntil: "domcontentloaded",
    });
    await page
      .getByRole("button", { name: /일정 생성하기/ })
      .first()
      .click();
    // 생성 완료: 결과 헤더 "… 완료" + "…일정" 제목.
    await page
      .getByText(/생성 완료/)
      .first()
      .waitFor({ timeout: 90000 });
    await page
      .getByRole("heading", { name: /일정$/ })
      .first()
      .waitFor({ timeout: 10000 });
    // 지도 타일이 그려질 시간을 준다.
    await page.waitForTimeout(4000);
    await shot(page, "step-4");
  }

  await ctx.close();
  log("완료.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
