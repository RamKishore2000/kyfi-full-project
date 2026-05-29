"use client";

import { useEffect, useState } from "react";
import { Footer } from "@/components/kyfi/footer";
import { AuthGuard } from "@/components/kyfi/auth-guard";
import { Header } from "@/components/kyfi/header";
import { ChangePasswordModal } from "@/components/kyfi/change-password-modal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchCurrentDealer, updateDealerLanguage } from "@/lib/api/profile";
import type { KyfiLanguage } from "@/lib/kyfi-i18n";
import { useKyfiLanguage } from "@/components/kyfi/language-provider";

export default function SettingsPage() {
  const { language, setLanguage, t } = useKyfiLanguage();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [savingLanguage, setSavingLanguage] = useState(false);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const response = await fetchCurrentDealer();
        const dealerLanguage = response.dealer.languagePreference;

        if (dealerLanguage === "en" || dealerLanguage === "te") {
          setLanguage(dealerLanguage);
        }
      } catch {
        // keep current language from local storage/context
      }
    };

    void loadLanguage();
  }, [setLanguage]);

  const selectLanguage = async (nextLanguage: KyfiLanguage) => {
    setError("");
    setMessage("");
    setSavingLanguage(true);

    try {
      const response = await updateDealerLanguage({ languagePreference: nextLanguage });
      const dealerLanguage = response.dealer?.languagePreference;

      if (dealerLanguage === "en" || dealerLanguage === "te") {
        setLanguage(dealerLanguage);
      } else {
        setLanguage(nextLanguage);
      }

      setMessage(nextLanguage === "te" ? "భాష విజయవంతంగా అప్‌డేట్ అయింది" : "Language updated successfully");
    } catch (languageError) {
      setError(languageError instanceof Error ? languageError.message : "Unable to update language");
    } finally {
      setSavingLanguage(false);
    }
  };

  return (
    <AuthGuard>
      <main className="kyfi-shell min-h-screen">
        <Header />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="font-manrope type-small uppercase tracking-[0.2em] text-emerald-700">
            Settings
          </p>
          <h1 className="mt-3 font-manrope type-section text-slate-900">
            {t("settings.title")}
          </h1>
          <p className="mt-4 font-manrope type-body text-slate-600">
            These settings reflect the document rules for registered and approved dealers.
          </p>
        </div>

        {message ? (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-manrope type-body text-emerald-800">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-manrope type-body text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden border-white/80 bg-white/85 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-manrope type-nav text-slate-900">{t("settings.language")}</p>
                  <h2 className="mt-1 font-manrope type-card text-slate-900">
                    English default, Telugu supported
                  </h2>
                </div>
                <Badge variant="secondary">Display</Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => void selectLanguage("en")}
                  className={[
                    "rounded-2xl border px-4 py-3 text-left transition",
                    language === "en"
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-slate-200 bg-slate-50 hover:border-emerald-200 hover:bg-emerald-50",
                  ].join(" ")}
                  disabled={savingLanguage}
                >
                  <p className="font-manrope type-nav text-slate-900">{t("settings.english")}</p>
                  <p className="mt-1 font-manrope type-small text-slate-600">
                    Default language
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => void selectLanguage("te")}
                  className={[
                    "rounded-2xl border px-4 py-3 text-left transition",
                    language === "te"
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-slate-200 bg-slate-50 hover:border-emerald-200 hover:bg-emerald-50",
                  ].join(" ")}
                  disabled={savingLanguage}
                >
                  <p className="font-manrope type-nav text-slate-900">{t("settings.telugu")}</p>
                  <p className="mt-1 font-manrope type-small text-slate-600">
                    Supported language
                  </p>
                </button>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-white/80 bg-white/85 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <CardContent className="space-y-4 p-6">
              <div>
                <p className="font-manrope type-nav text-slate-900">{t("settings.changePassword")}</p>
                <h2 className="mt-1 font-manrope type-card text-slate-900">
                  {t("settings.passwordHeader")}
                </h2>
              </div>
              <p className="font-manrope type-body text-slate-600">
                Use this option to update your password after dealer approval.
              </p>
              <Button
                type="button"
                onClick={() => setChangePasswordOpen(true)}
                className="inline-flex rounded-2xl bg-primary px-4 py-3 font-manrope type-nav font-semibold !text-white transition hover:bg-primary/90"
                style={{ color: "#ffffff" }}
              >
                {t("settings.submitPassword")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <ChangePasswordModal
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />

        <Footer />
      </main>
    </AuthGuard>
  );
}
