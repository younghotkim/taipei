import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ConfirmProvider } from "./components/ConfirmProvider";
import { PinGate } from "./components/PinGate";
import { PwaRegister } from "./components/PwaRegister";

export const metadata: Metadata = {
  title: "Y&S Taipei · 西門町 Trip Diary",
  description: "5.15-5.18 타이베이 여행 일정과 우리가 남길 기록",
  applicationName: "Y&S Taipei",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Y&S Taipei"
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
        <PinGate>
          <ConfirmProvider>{children}</ConfirmProvider>
        </PinGate>
        <PwaRegister />
      </body>
    </html>
  );
}
