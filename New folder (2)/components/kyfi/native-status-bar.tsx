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

    const isLoginPage = pathname?.startsWith("/login");

    document.body.classList.toggle("kyfi-native-login", Boolean(isLoginPage));
    document.documentElement.classList.toggle(
      "kyfi-native-login-root",
      Boolean(isLoginPage),
    );

    const backgroundColor = isLoginPage ? "#F8F7F4" : "#F6FAF7";

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
