import type { Metadata } from "next";
import Image from "next/image";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { isSafeNextPath } from "@/lib/authRedirect";

import { GoogleLoginButton } from "./_components/GoogleLoginButton";
import { KakaoLoginButton } from "./_components/KakaoLoginButton";

export const metadata: Metadata = {
  title: "로그인 | PickTrip",
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next: rawNext, error } = await searchParams;
  const next = isSafeNextPath(rawNext) ? rawNext : "/";

  return (
    <main className="grid min-h-[calc(100vh-56px)] grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[oklch(0.63_0.2_30)] to-[oklch(0.5_0.19_14)] p-14 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <Image src="/pick-trip-icon.svg" alt="" width={24} height={24} />
          <span className="text-xl font-extrabold">PickTrip</span>
        </div>
        <div>
          <p className="text-[38px] leading-[1.25] font-extrabold tracking-tight">
            고른 콘텐츠가
            <br />
            일정이 됩니다
          </p>
          <p className="mt-4 max-w-[340px] text-[14.5px] leading-relaxed text-white/82">
            담아둔 콘텐츠와 찜한 장소는 로그인하면 어디서든 이어볼 수 있어요.
          </p>
        </div>
        <div className="flex gap-2">
          {["하동", "영주", "예천"].map((region) => (
            <span
              key={region}
              className="rounded-full bg-white/18 px-3.5 py-1.5 text-xs font-bold"
            >
              {region}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center p-10">
        <div className="w-full max-w-[380px]">
          <p className="text-[11.5px] font-extrabold tracking-widest text-primary/70 uppercase">
            Welcome
          </p>
          <h1 className="mt-2.5 text-[30px] font-extrabold tracking-tight">
            로그인
          </h1>
          <p className="mt-2.5 text-[14.5px] text-muted-foreground">
            소셜 계정으로 간편하게 로그인하세요.
          </p>

          {error && (
            <Alert variant="destructive" className="mt-6">
              <AlertDescription>
                로그인에 실패했습니다. 다시 시도해주세요.
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-7 flex flex-col items-center gap-3">
            <KakaoLoginButton
              href={`/auth/kakao/start?next=${encodeURIComponent(next)}`}
            />
            <GoogleLoginButton
              href={`/auth/google/start?next=${encodeURIComponent(next)}`}
            />
          </div>

          <div className="mt-5.5 rounded-xl bg-[oklch(0.975_0.012_30)] px-4 py-3.5 text-[12.5px] leading-relaxed text-muted-foreground">
            로그인 없이도 콘텐츠 둘러보기와 AI 일정 생성은 이용할 수 있어요.
          </div>
        </div>
      </div>
    </main>
  );
}
