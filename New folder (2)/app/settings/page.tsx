"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/kyfi/footer";
import { AuthGuard } from "@/components/kyfi/auth-guard";
import { Header } from "@/components/kyfi/header";
import { AppBackButton } from "@/components/kyfi/app-back-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KyfiToast } from "@/components/kyfi/kyfi-toast";
import { fetchCurrentDealer, updateDealerLanguage } from "@/lib/api/profile";
import type { KyfiLanguage } from "@/lib/kyfi-i18n";
import { useKyfiLanguage } from "@/components/kyfi/language-provider";

export default function SettingsPage() {
  const { language, setLanguage, t } = useKyfiLanguage();
  const router = useRouter();
  const [error, setError] = useState("");
  const [savingLanguage, setSavingLanguage] = useState(false);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    tone: "success" | "error";
  }>({
    open: false,
    message: "",
    tone: "success",
  });

  const showToast = (nextMessage: string, tone: "success" | "error" = "success") => {
    setToast({ open: true, message: nextMessage, tone });
  };

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
    setSavingLanguage(true);

    try {
      const response = await updateDealerLanguage({ languagePreference: nextLanguage });
      const dealerLanguage = response.dealer?.languagePreference;

      if (dealerLanguage === "en" || dealerLanguage === "te") {
        setLanguage(dealerLanguage);
      } else {
        setLanguage(nextLanguage);
      }

      showToast(nextLanguage === "te" ? t("settings.languageSavedTe") : t("settings.languageSavedEn"));
    } catch (languageError) {
      const nextError =
        languageError instanceof Error ? languageError.message : t("settings.loadLanguageFailed");
      setError(nextError);
      showToast(nextError, "error");
    } finally {
      setSavingLanguage(false);
    }
  };

  return (
    <AuthGuard>
      <main className="kyfi-shell min-h-screen">
        <Header />
        <AppBackButton />

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-3xl">
            <p className="font-manrope type-small uppercase tracking-[0.2em] text-emerald-700">
              {t("settings.title")}
            </p>
            <h1 className="mt-3 font-manrope type-section text-slate-900">{t("settings.title")}</h1>
            <p className="mt-4 font-manrope type-body text-slate-600">{t("settings.description")}</p>
          </div>

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
                      {t("settings.languageCardTitle")}
                    </h2>
                  </div>
                  <Badge variant="secondary">{t("settings.display")}</Badge>
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
                      {t("settings.languageDefaultNote")}
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
                      {t("settings.languageSupportedNote")}
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
                <p className="font-manrope type-body text-slate-600">{t("settings.passwordDescription")}</p>
                <Button
                  type="button"
                  onClick={() => router.push("/change-password" as any)}
                  className="inline-flex rounded-2xl bg-primary px-4 py-3 font-manrope type-nav font-semibold !text-white transition hover:bg-primary/90"
                  style={{ color: "#ffffff" }}
                >
                  {t("settings.submitPassword")}
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <KyfiToast
          open={toast.open}
          message={toast.message}
          tone={toast.tone}
          onClose={() => setToast((current) => ({ ...current, open: false }))}
        />

        <Footer />
      </main>
    </AuthGuard>
  );
}
