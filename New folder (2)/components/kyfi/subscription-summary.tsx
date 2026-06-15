"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import {
  fetchSubscriptionSettings,
  type SubscriptionRecord,
} from "@/lib/api/subscription";

function formatCurrency(amount?: number | null, currency = "INR") {
  const value = Number(amount || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function SubscriptionSummary() {
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(
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

  const planName = subscription?.planName || "One Year Plan";
  const duration = subscription?.durationLabel || "1 Year";
  const price =
    subscription?.yearlyPrice !== undefined && subscription?.yearlyPrice !== null
      ? formatCurrency(subscription.yearlyPrice, subscription.currency || "INR")
      : "Loading...";

  return (
    <section className="kyfi-subscription-summary mx-auto max-w-7xl px-4 pb-8 sm:px-6 sm:pb-12 lg:px-8">
      <div className="kyfi-subscription-shell rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-5 shadow-[0_16px_45px_rgba(15,23,42,0.06)] sm:p-6 lg:p-7">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="font-manrope type-small uppercase tracking-[0.2em] text-[rgb(4,120,87)]">
              KYFI subscription
            </p>
            <h2 className="mt-2 font-manrope text-2xl font-black tracking-[-0.04em] text-slate-950 sm:text-3xl">
              Yearly dealer access
            </h2>
            <p className="kyfi-subscription-description mt-3 max-w-xl font-manrope text-sm leading-6 text-slate-600 sm:text-base">
              Digital access for farmer search, new farmer records, old farmer
              votes, and dealer account tools. No physical delivery is involved.
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
                "Dealer dashboard",
                "Farmer search",
                "Status records",
                "Old farmer votes",
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
          </div>
        </div>
      </div>
    </section>
  );
}
