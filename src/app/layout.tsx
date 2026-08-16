import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
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
  title: "PickTrip | 하동·영주·예천 여행 콘텐츠와 AI 일정",
  description:
    "하동, 영주, 예천의 여행 콘텐츠와 AI 맞춤 일정을 제공하는 Pick Trip",
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
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
