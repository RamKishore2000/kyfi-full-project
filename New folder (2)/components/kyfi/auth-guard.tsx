"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchCurrentDealer } from "@/lib/api/profile";
import { isSubscriptionRedirectPending } from "@/lib/api/subscription-expiry";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const token = window.localStorage.getItem("kyfi_token");
    const dealerJson = window.localStorage.getItem("kyfi_dealer");
    const pendingDealerJson = window.localStorage.getItem("kyfi_pending_dealer");

    const parseDealer = (value: string | null) => {
      if (!value) {
        return null;
      }

      try {
        return JSON.parse(value) as {
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
    };

    const allowOrRedirect = (dealer: ReturnType<typeof parseDealer>) => {
      if (cancelled) {
        return;
      }

      if (!dealer) {
        if (isSubscriptionRedirectPending()) {
          router.replace("/register?step=subscription");
          return;
        }

        router.replace("/login");
        return;
      }

      const subscriptionStatus = String(
        dealer.subscriptionStatus || dealer.subscription_status || "",
      )
        .trim()
        .toLowerCase();
      const expiresAt = dealer.subscriptionExpiresAt
        ? new Date(dealer.subscriptionExpiresAt)
        : dealer.subscription_expires_at
          ? new Date(dealer.subscription_expires_at)
          : null;
      const subscriptionActive =
        subscriptionStatus === "active" &&
        !!expiresAt &&
        !Number.isNaN(expiresAt.getTime()) &&
        expiresAt.getTime() > Date.now();
      const trialStatus = String(dealer.trialStatus || dealer.trial_status || "")
        .trim()
        .toLowerCase();
      const trialExpiresAt = dealer.trialExpiresAt
        ? new Date(dealer.trialExpiresAt)
        : dealer.trial_expires_at
          ? new Date(dealer.trial_expires_at)
          : null;
      const trialActive =
        trialStatus === "active" &&
        !!trialExpiresAt &&
        !Number.isNaN(trialExpiresAt.getTime()) &&
        trialExpiresAt.getTime() > Date.now();
      const backendAllowsAccess =
        String(dealer.accessStatus || "").trim().toLowerCase() === "allowed";

      if (!subscriptionActive && !trialActive && !backendAllowsAccess) {
        router.replace("/register?step=subscription");
        return;
      }

      const dealerStatus = String(dealer.status || "").trim().toLowerCase();
      if (!trialActive && dealerStatus !== "approved") {
        router.replace("/login");
        return;
      }

      setReady(true);
    };

    if (!token) {
      if (isSubscriptionRedirectPending() || pendingDealerJson) {
        router.replace("/register?step=subscription");
        return;
      }

      router.replace("/login");
      return;
    }

    allowOrRedirect(parseDealer(dealerJson));

    fetchCurrentDealer()
      .then((response) => {
        if (cancelled) {
          return;
        }

        window.localStorage.setItem(
          "kyfi_dealer",
          JSON.stringify(response.dealer),
        );
        window.dispatchEvent(new Event("kyfi-auth-changed"));
        allowOrRedirect(response.dealer);
      })
      .catch(() => {
        if (!cancelled) {
          setReady(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
}
