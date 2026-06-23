"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { useRouter } from "next/navigation";
import DashboardPage from "./dashboard/page";
import { isSubscriptionRedirectPending } from "@/lib/api/subscription-expiry";

export default function HomePage() {
  const router = useRouter();
  const [showWebsiteDashboard, setShowWebsiteDashboard] = useState(false);

  useEffect(() => {
    const hasPendingDealer =
      typeof window !== "undefined" &&
      Boolean(window.localStorage.getItem("kyfi_pending_dealer"));

    if (isSubscriptionRedirectPending() || hasPendingDealer) {
      router.replace("/register?step=subscription");
      return;
    }

    if (Capacitor.isNativePlatform()) {
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
