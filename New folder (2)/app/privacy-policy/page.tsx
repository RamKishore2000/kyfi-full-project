"use client";

import { Footer } from "@/components/kyfi/footer";
import { Header } from "@/components/kyfi/header";
import { Badge } from "@/components/ui/badge";
import { useKyfiLanguage } from "@/components/kyfi/language-provider";

const sections = [
  {
    titleKey: "privacy.whatWeCollect",
    items: [
      "privacy.collectDealer",
      "privacy.collectRecords",
      "privacy.collectBlacklist",
      "privacy.collectSensitive",
    ],
  },
  {
    titleKey: "privacy.whatWeUse",
    items: [
      "privacy.useSearch",
      "privacy.useBlacklist",
      "privacy.useSignals",
      "privacy.useAccess",
    ],
  },
  {
    titleKey: "privacy.howProtect",
    items: [
      "privacy.protectApproved",
      "privacy.protectMasked",
      "privacy.protectAnonymous",
      "privacy.protectIndia",
    ],
  },
  {
    titleKey: "privacy.responsibilities",
    items: [
      "privacy.roleUse",
      "privacy.roleSecure",
      "privacy.roleFollow",
      "privacy.roleNoPayments",
    ],
  },
];

export default function PrivacyPolicyPage() {
  const { t } = useKyfiLanguage();

  return (
    <main className="kyfi-shell min-h-screen">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <p className="font-manrope type-small uppercase tracking-[0.2em] text-emerald-700">
            {t("privacy.important")}
          </p>
          <h1 className="mt-3 font-manrope type-section text-slate-900">
            {t("privacy.title")}
          </h1>
          <p className="mt-4 font-manrope type-body text-slate-600">
            {t("privacy.intro")}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {sections.map((section) => (
            <article
              key={section.titleKey}
              className="rounded-3xl border border-white/80 bg-white/85 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-manrope type-card text-slate-900">{t(section.titleKey)}</h2>
                <Badge variant="secondary">KYFI</Badge>
              </div>
              <ul className="mt-4 space-y-3 font-manrope type-body text-slate-600">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[rgb(4,120,87)]" />
                    <span>{t(item)}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50/70 p-6">
          <p className="font-manrope type-nav text-emerald-900">{t("privacy.important")}</p>
          <p className="mt-2 font-manrope type-body text-slate-700">
            {t("privacy.importantBody")}
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
