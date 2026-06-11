"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { usePathname } from "next/navigation";

export function NativeStatusBar() {
  const pathname = usePathname();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const backgroundColor = pathname?.startsWith("/login")
      ? "#F8F7F4"
      : "#F8F8F6";

    void StatusBar.setOverlaysWebView({ overlay: false });
    void StatusBar.setBackgroundColor({ color: backgroundColor });
    void StatusBar.setStyle({ style: Style.Light });
  }, [pathname]);

  return null;
}
