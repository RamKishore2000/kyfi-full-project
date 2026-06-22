"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import {
  fetchSubscriptionSettings,
  type SubscriptionRecord,
} from "@/lib/api/subscription";
import { useKyfiLanguage } from "@/components/kyfi/language-provider";

function formatCurrency(amount?: number | null, currency = "INR") {
  const value = Number(amount || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function SubscriptionSummary() {
  const { t } = useKyfiLanguage();
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(
    null,
  );
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number | null>(
    null,
  );

  useEffect(() => {
    let active = true;

    fetchSubscriptionSettings()
      .then((response) => {
        if (active) {
          setSubscription(response.subscription);
        }
      })
      .catch(() => {
        if (active) {
          setSubscription(null);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const readDealerTrial = () => {
      const dealerJson = window.localStorage.getItem("kyfi_dealer");
      if (!dealerJson) {
        setTrialDaysRemaining(null);
        return;
      }

      try {
        const dealer = JSON.parse(dealerJson) as {
          trialStatus?: string;
          trialExpiresAt?: string | null;
          trialDaysRemaining?: number | null;
        };
        const trialStatus = String(dealer.trialStatus || "")
          .trim()
          .toLowerCase();

        if (trialStatus !== "active") {
          setTrialDaysRemaining(null);
          return;
        }

        if (typeof dealer.trialDaysRemaining === "number") {
          setTrialDaysRemaining(Math.max(0, dealer.trialDaysRemaining));
          return;
        }

        const expiresAt = dealer.trialExpiresAt
          ? new Date(dealer.trialExpiresAt)
          : null;

        if (!expiresAt || Number.isNaN(expiresAt.getTime())) {
          setTrialDaysRemaining(null);
          return;
        }

        const remaining = Math.ceil(
          (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        );
        setTrialDaysRemaining(Math.max(0, remaining));
      } catch {
        setTrialDaysRemaining(null);
      }
    };

    readDealerTrial();
    window.addEventListener("kyfi-auth-changed", readDealerTrial);
    window.addEventListener("storage", readDealerTrial);

    return () => {
      window.removeEventListener("kyfi-auth-changed", readDealerTrial);
      window.removeEventListener("storage", readDealerTrial);
    };
  }, []);

  const planName = subscription?.planName || "One Year Plan";
  const duration = subscription?.durationLabel || "1 Year";
  const price =
    subscription?.yearlyPrice !== undefined && subscription?.yearlyPrice !== null
      ? formatCurrency(subscription.yearlyPrice, subscription.currency || "INR")
      : t("subscription.loading");
  const freeTrialDays = Number(subscription?.freeTrialDays || 0);

  return (
    <section className="kyfi-subscription-summary mx-auto max-w-7xl px-4 pb-8 sm:px-6 sm:pb-12 lg:px-8">
      <div className="kyfi-subscription-shell rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-5 shadow-[0_16px_45px_rgba(15,23,42,0.06)] sm:p-6 lg:p-7">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="font-manrope type-small uppercase tracking-[0.2em] text-[rgb(4,120,87)]">
              {t("subscription.kicker")}
            </p>
            <h2 className="mt-2 font-manrope text-2xl font-black tracking-[-0.04em] text-slate-950 sm:text-3xl">
              {t("subscription.title")}
            </h2>
            <p className="kyfi-subscription-description mt-3 max-w-xl font-manrope text-sm leading-6 text-slate-600 sm:text-base">
              {t("subscription.description")}
            </p>
          </div>

          <div className="rounded-[1.35rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-white p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-manrope text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  {planName}
                </p>
                <div className="mt-2 flex flex-wrap items-end gap-3">
                  <p className="font-manrope text-4xl font-black tracking-[-0.05em] text-[rgb(4,120,87)]">
                    {price}
                  </p>
                  <p className="pb-1 font-manrope text-sm font-bold text-slate-500">
                    / {duration}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {[
                t("subscription.featureDashboard"),
                t("subscription.featureSearch"),
                t("subscription.featureRecords"),
                t("subscription.featureVotes"),
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 font-manrope text-sm font-bold text-slate-700"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[rgb(4,120,87)]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3">
                <p className="font-manrope text-[0.68rem] font-black uppercase tracking-[0.18em] text-slate-500">
                  {t("subscription.freeTrialProvided")}
                </p>
                <p className="mt-1 font-manrope text-xl font-black text-slate-950">
                  {freeTrialDays} {freeTrialDays === 1 ? "day" : "days"}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3">
                <p className="font-manrope text-[0.68rem] font-black uppercase tracking-[0.18em] text-slate-500">
                  {t("subscription.trialDaysRemaining")}
                </p>
                <p className="mt-1 font-manrope text-xl font-black text-[rgb(4,120,87)]">
                  {trialDaysRemaining === null
                    ? "-"
                    : `${trialDaysRemaining} ${
                        trialDaysRemaining === 1 ? "day" : "days"
                      }`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
