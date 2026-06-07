"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CreditCard, Loader2, Save, Sparkles } from "lucide-react";
import { useAdminLanguage } from "@/components/admin-language-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/navigation/page-header";
import {
  fetchAdminSubscription,
  updateAdminSubscription,
  type AdminSubscriptionRecord,
} from "@/lib/api/subscription";

const planPoints = [
  "Farmer search, status updates, and records",
  "Mandal and village dependent workflows",
  "Old and new farmer separation",
];

export default function SubscriptionAdminPage() {
  const { t } = useAdminLanguage();
  const [subscription, setSubscription] =
    useState<AdminSubscriptionRecord | null>(null);
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let mounted = true;

    fetchAdminSubscription()
      .then((response) => {
        if (!mounted) return;
        setSubscription(response.subscription);
        setPrice(String(response.subscription.yearlyPrice ?? ""));
      })
      .catch((fetchError) => {
        if (!mounted) return;
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : t("subscription.loading"),
        );
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [t]);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: subscription?.currency || "INR",
        maximumFractionDigits: 0,
      }),
    [subscription?.currency],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const normalizedPrice = Number(price);

    if (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
      setError("Enter a valid yearly price");
      return;
    }

    setSaving(true);

    try {
      const response = await updateAdminSubscription(normalizedPrice);
      setSubscription(response.subscription);
      setPrice(String(response.subscription.yearlyPrice));
      setSuccess(response.message);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : t("subscription.save"),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title={t("subscription.title")}
        description={t("subscription.description")}
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden border-emerald-100 shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-700" />
              {t("subscription.currentPlan")}
            </CardTitle>
            <CardDescription>{t("subscription.priceHelp")}</CardDescription>
          </CardHeader>

          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[0.72rem] font-black uppercase tracking-[0.22em] text-emerald-700">
                    {t("subscription.currentPlan")}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {subscription?.planName || "One Year Plan"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {subscription?.durationLabel || t("subscription.duration")}
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                  <p className="text-[0.72rem] font-black uppercase tracking-[0.22em] text-emerald-700">
                    {t("subscription.previewLabel")}
                  </p>
                  <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">
                    {currencyFormatter.format(
                      Number(price || subscription?.yearlyPrice || 0),
                    )}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    /{" "}
                    {subscription?.durationLabel || t("subscription.duration")}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-semibold text-slate-900"
                  htmlFor="yearlyPrice"
                >
                  {t("subscription.priceLabel")}
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
                    ₹
                  </span>
                  <Input
                    id="yearlyPrice"
                    inputMode="decimal"
                    type="number"
                    min="0"
                    step="1"
                    className="pl-8"
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    placeholder="1999"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  {t("subscription.priceHelp")}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {planPoints.map((point) => (
                  <div
                    key={point}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm"
                  >
                    {point}
                  </div>
                ))}
              </div>

              {error ? (
                <p className="text-sm font-medium text-red-600">{error}</p>
              ) : null}
              {success ? (
                <p className="text-sm font-medium text-emerald-700">
                  {success}
                </p>
              ) : null}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="min-w-44"
                  disabled={saving || loading}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {t("subscription.save")}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-emerald-100 bg-gradient-to-br from-emerald-950 via-slate-950 to-slate-900 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
          <CardContent className="space-y-5 p-6 sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.22em] text-white/80">
              <Sparkles className="h-4 w-4" />
              {t("subscription.previewLabel")}
            </div>
            <h2 className="font-manrope text-[2rem] font-black tracking-[-0.05em] text-white">
              {subscription?.planName || "One Year Plan"}
            </h2>
            <p className="max-w-md text-sm leading-6 text-white/75">
              Dealers will see this live price on the public subscription page.
            </p>

            <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5">
              <p className="text-[0.7rem] font-black uppercase tracking-[0.24em] text-emerald-200">
                {t("subscription.priceLabel")}
              </p>
              <p className="mt-2 text-4xl font-black tracking-[-0.06em] text-white">
                {currencyFormatter.format(
                  Number(price || subscription?.yearlyPrice || 0),
                )}
              </p>
              <p className="mt-1 text-sm text-white/70">
                / {subscription?.durationLabel || t("subscription.duration")}
              </p>
            </div>

            <div className="grid gap-3">
              {planPoints.map((point) => (
                <div
                  key={point}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/85"
                >
                  {point}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
