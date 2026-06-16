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

    document.body.classList.add("kyfi-native-app");
    document.documentElement.classList.add("kyfi-native-root");

    const isAuthPage =
      pathname?.startsWith("/login") || pathname?.startsWith("/register");

    document.body.classList.toggle("kyfi-native-login", Boolean(isAuthPage));
    document.documentElement.classList.toggle(
      "kyfi-native-login-root",
      Boolean(isAuthPage),
    );

    const backgroundColor = isAuthPage ? "#F8F7F4" : "#F6FAF7";

    // Keep the WebView below the native status bar. This avoids device-specific
    // double spacing and dark edge-to-edge strips on Android 15+.
    void StatusBar.setOverlaysWebView({ overlay: false });
    void StatusBar.setBackgroundColor({ color: backgroundColor });
    void StatusBar.setStyle({ style: Style.Light });

    return () => {
      document.body.classList.remove("kyfi-native-app");
      document.body.classList.remove("kyfi-native-login");
      document.documentElement.classList.remove("kyfi-native-root");
      document.documentElement.classList.remove("kyfi-native-login-root");
    };
  }, [pathname]);

  return null;
}
