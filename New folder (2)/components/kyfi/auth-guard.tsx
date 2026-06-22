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
              trialStatus?: string;
              trialExpiresAt?: string | null;
              trial_status?: string;
              trial_expires_at?: string | null;
              accessStatus?: string;
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
      !!expiresAt &&
      !Number.isNaN(expiresAt.getTime()) &&
      expiresAt.getTime() > Date.now();
    const trialStatus = String(dealer?.trialStatus || dealer?.trial_status || "")
      .trim()
      .toLowerCase();
    const trialExpiresAt = dealer?.trialExpiresAt
      ? new Date(dealer.trialExpiresAt)
      : dealer?.trial_expires_at
        ? new Date(dealer.trial_expires_at)
        : null;
    const trialActive =
      trialStatus === "active" &&
      !!trialExpiresAt &&
      !Number.isNaN(trialExpiresAt.getTime()) &&
      trialExpiresAt.getTime() > Date.now();
    const backendAllowsAccess =
      String(dealer?.accessStatus || "").trim().toLowerCase() === "allowed";

    if (!subscriptionActive && !trialActive && !backendAllowsAccess) {
      router.replace("/register?step=subscription");
      return;
    }

    const dealerStatus = String(dealer?.status || "").trim().toLowerCase();
    if (!trialActive && dealerStatus !== "approved") {
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
