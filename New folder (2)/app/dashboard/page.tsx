"use client";

import { AuthGuard } from "@/components/kyfi/auth-guard";
import { Header } from "@/components/kyfi/header";
import { HeroBanner } from "@/components/kyfi/hero-banner";
import { FeatureCard } from "@/components/kyfi/feature-card";
import { HowItWorks } from "@/components/kyfi/how-it-works";
import { DashboardPreview } from "@/components/kyfi/dashboard-preview";
import { StatusCard } from "@/components/kyfi/status-card";
import { CTASection } from "@/components/kyfi/cta-section";
import { Footer } from "@/components/kyfi/footer";
import { BarChart3, CirclePlus, Search, ShieldAlert, Users } from "lucide-react";
import { useKyfiLanguage } from "@/components/kyfi/language-provider";

export default function DashboardPage() {
  const { t } = useKyfiLanguage();
  const features = [
    {
      icon: <Search className="h-5 w-5" />,
      title: t("dashboard.feature1.title"),
      description: t("dashboard.feature1.description"),
      href: "/search-farmer-status",
    },
    {
      icon: <CirclePlus className="h-5 w-5" />,
      title: t("dashboard.feature2.title"),
      description: t("dashboard.feature2.description"),
      href: "/add-farmer-status",
    },
    {
      icon: <ShieldAlert className="h-5 w-5" />,
      title: t("dashboard.feature3.title"),
      description: t("dashboard.feature3.description"),
      href: "/blacklist-browser",
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: t("dashboard.feature4.title"),
      description: t("dashboard.feature4.description"),
    },
    {
      icon: <ShieldAlert className="h-5 w-5" />,
      title: t("dashboard.feature5.title"),
      description: t("dashboard.feature5.description"),
      href: "/add-to-blacklist",
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: t("dashboard.feature6.title"),
      description: t("dashboard.feature6.description"),
      href: "/my-records",
    },
  ];
  return (
    <AuthGuard>
      <main className="min-h-screen kyfi-shell">
        <Header />
        <HeroBanner />

        <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="font-manrope type-small uppercase tracking-[0.2em] text-emerald-700">
              {t("menu.shortcuts")}
            </p>
            <h2 className="mt-3 font-manrope type-section lg:whitespace-nowrap">
              {t("dashboard.shortcutsTitle")}
            </h2>
            <p className="mt-4 font-manrope type-body">
              {t("dashboard.shortcutsDescription")}
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} {...feature} index={index} />
            ))}
          </div>
        </section>

        <DashboardPreview />

        <HowItWorks />

        <section id="status" className="mx-auto max-w-7xl px-4 pt-4 pb-12 sm:px-6 sm:py-20 lg:px-8">
          <div className="max-w-3xl">
            <p className="kyfi-section-kicker">{t("search.status")}</p>
            <h2 className="mt-4 font-manrope text-[clamp(1.9rem,3vw,3rem)] font-extrabold tracking-[-0.04em] text-slate-900">
              {t("search.legendGreen")}
            </h2>
            <p className="mt-4 max-w-2xl text-[1rem] leading-8 text-slate-600">
              {t("search.emptyHint")}
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <StatusCard
              status="GREEN"
              title={t("search.legendGreen")}
              text={t("search.legendGreen")}
              index={0}
            />
            <StatusCard
              status="YELLOW"
              title={t("search.legendYellow")}
              text={t("search.legendYellow")}
              index={1}
            />
            <StatusCard
              status="RED"
              title={t("search.legendRed")}
              text={t("search.legendRed")}
              index={2}
            />
          </div>
        </section>

        <CTASection />

        <Footer />
      </main>
    </AuthGuard>
  );
}
