"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { usePathname, useRouter } from "next/navigation";

const mainAppRoutes = new Set(["/", "/dashboard", "/login", "/register"]);
const policyRoutes = new Set([
  "/privacy-policy",
  "/terms-of-use",
  "/refund-policy",
  "/cancellation-policy",
  "/digital-service-delivery",
  "/contact-support",
  "/subscription-pricing",
]);

function getFallbackRoute(pathname: string) {
  if (policyRoutes.has(pathname) || pathname === "/change-password") {
    return "/settings";
  }

  return "/dashboard";
}

export function NativeBackHandler() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !pathname) {
      return;
    }

    if (mainAppRoutes.has(pathname)) {
      return;
    }

    const currentState = window.history.state;
    if (currentState?.kyfiNativeBackPath !== pathname) {
      window.history.pushState(
        {
          ...currentState,
          kyfiNativeBackPath: pathname,
        },
        "",
        window.location.href,
      );
    }

    const handlePopState = () => {
      router.replace(getFallbackRoute(pathname));
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [pathname, router]);

  return null;
}
