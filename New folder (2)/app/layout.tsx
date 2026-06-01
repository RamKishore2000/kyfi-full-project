import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/manrope/800.css";
import "./globals.css";
import { NativeStatusBar } from "@/components/kyfi/native-status-bar";
import { LanguageProvider } from "@/components/kyfi/language-provider";
import { MobileBottomTabs } from "@/components/kyfi/mobile-bottom-tabs";

export const metadata: Metadata = {
  title: "KYFI - Know Your Farmer Information",
  description:
    "Dealer-facing farmer credit reputation platform for pesticide dealers across Andhra Pradesh and Telangana.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <NativeStatusBar />
          {children}
          <MobileBottomTabs />
        </LanguageProvider>
      </body>
    </html>
  );
}
