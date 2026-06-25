"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { useRouter } from "next/navigation";
import DashboardPage from "./dashboard/page";
import { isSubscriptionRedirectPending } from "@/lib/api/subscription-expiry";
import { consumeNativeMediaReturnRoute } from "@/lib/native-media-return";

export default function HomePage() {
  const router = useRouter();
  const [showWebsiteDashboard, setShowWebsiteDashboard] = useState(false);

  useEffect(() => {
    if (isSubscriptionRedirectPending()) {
      router.replace("/register?step=subscription");
      return;
    }

    const isNative = Capacitor.isNativePlatform();
    if (isNative) {
      const mediaReturnRoute = consumeNativeMediaReturnRoute();
      if (mediaReturnRoute) {
        router.replace(mediaReturnRoute as Parameters<typeof router.replace>[0]);
        return;
      }

      if (window.localStorage.getItem("kyfi_token")) {
        router.replace("/dashboard");
        return;
      }

      router.replace("/login");
      return;
    }

    setShowWebsiteDashboard(true);
  }, [router]);

  if (!showWebsiteDashboard) {
    return <main className="min-h-[100dvh] bg-[#F8F7F4]" />;
  }

  return <DashboardPage />;
}
