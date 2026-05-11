import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegister } from "./components/PwaRegister";

export const metadata: Metadata = {
  title: "🇹🇼 台北 Trip Diary · 西門町 Neon",
  description: "5.15-5.18 타이베이 여행 일정과 우리가 남길 기록",
  applicationName: "台北 Trip",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "台北 Trip"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0524"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
