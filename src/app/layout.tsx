import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SITE_URL } from "@/lib/site";
import { cn } from "@/lib/utils";
import { Providers } from "./providers";

// Paperlogy는 Thin(100)~Black(900) 9개 굵기를 개별 파일로 제공한다. Tailwind
// 기본 font-weight 스케일과 1:1 대응시켜, 굵기 유틸리티마다 실제 폰트 파일이
// 매핑되고 브라우저가 페이크 볼드를 합성하지 않도록 한다.
const paperlogy = localFont({
  src: [
    { path: "./fonts/paperlogy/Paperlogy-1Thin.ttf", weight: "100" },
    { path: "./fonts/paperlogy/Paperlogy-2ExtraLight.ttf", weight: "200" },
    { path: "./fonts/paperlogy/Paperlogy-3Light.ttf", weight: "300" },
    { path: "./fonts/paperlogy/Paperlogy-4Regular.ttf", weight: "400" },
    { path: "./fonts/paperlogy/Paperlogy-5Medium.ttf", weight: "500" },
    { path: "./fonts/paperlogy/Paperlogy-6SemiBold.ttf", weight: "600" },
    { path: "./fonts/paperlogy/Paperlogy-7Bold.ttf", weight: "700" },
    { path: "./fonts/paperlogy/Paperlogy-8ExtraBold.ttf", weight: "800" },
    { path: "./fonts/paperlogy/Paperlogy-9Black.ttf", weight: "900" },
  ],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  // OG/Twitter 이미지처럼 절대 URL이 필요한 필드가 상대 경로로 선언될 수 있게
  // 기준 origin을 지정한다. 없으면 배포 환경에서 localhost로 대체된다.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "PickTrip | 하동·영주·예천 여행 콘텐츠와 AI 일정",
    // 하위 라우트가 title을 문자열로 선언하면 뒤에 브랜드가 붙는다.
    // (루트 layout과 같은 세그먼트인 app/page.tsx에는 적용되지 않는다)
    template: "%s | PickTrip",
  },
  description:
    "하동, 영주, 예천의 여행 콘텐츠와 AI 맞춤 일정을 제공하는 PickTrip",
  openGraph: {
    type: "website",
    siteName: "PickTrip",
    locale: "ko_KR",
    // "./"는 현재 경로로 해석되므로 페이지마다 og:url이 자기 주소를 가리킨다.
    url: "./",
    // title/description은 일부러 비워 둔다. 비워 두면 각 페이지의 최종
    // title/description을 og:title, og:description으로 그대로 물려받는다.
    images: [
      { url: "/og-image.png", width: 1200, height: 630, alt: "PickTrip" },
    ],
  },
  // title/description/images는 위 openGraph 값에서 자동으로 채워진다.
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={cn("h-full", "antialiased", "font-sans", paperlogy.variable)}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <Header />
          {/* 콘텐츠가 뷰포트보다 짧아도 Footer가 콘텐츠 바로 아래로 붙지 않고
              항상 화면 맨 아래에 위치하도록, 이 래퍼가 남는 세로 공간을
              채운다(sticky footer 패턴). 콘텐츠가 뷰포트보다 길면 이 래퍼는
              콘텐츠 높이만큼 자라 평소처럼 스크롤 후 맨 아래에 Footer가 온다. */}
          <div className="flex-1">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
