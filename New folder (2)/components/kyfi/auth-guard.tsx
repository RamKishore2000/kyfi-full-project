"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = window.localStorage.getItem("kyfi_token");
    const dealerJson = window.localStorage.getItem("kyfi_dealer");
    const dealer = dealerJson
      ? (() => {
          try {
            return JSON.parse(dealerJson) as {
              status?: string;
              subscriptionStatus?: string;
              subscriptionExpiresAt?: string | null;
              subscription_status?: string;
              subscription_expires_at?: string | null;
            };
          } catch {
            return null;
          }
        })()
      : null;

    if (!token) {
      router.replace("/login");
      return;
    }

    const subscriptionStatus = String(
      dealer?.subscriptionStatus || dealer?.subscription_status || "",
    )
      .trim()
      .toLowerCase();
    const expiresAt = dealer?.subscriptionExpiresAt
      ? new Date(dealer.subscriptionExpiresAt)
      : dealer?.subscription_expires_at
        ? new Date(dealer.subscription_expires_at)
        : null;
    const subscriptionActive =
      subscriptionStatus === "active" &&
      (!expiresAt ||
        Number.isNaN(expiresAt.getTime()) ||
        expiresAt.getTime() > Date.now());

    if (!subscriptionActive) {
      router.replace("/register?step=subscription");
      return;
    }

    const dealerStatus = String(dealer?.status || "").trim().toLowerCase();
    if (dealerStatus !== "approved") {
      router.replace("/login");
      return;
    }

    setReady(true);
  }, [router]);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
}
