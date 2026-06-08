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
import { BarChart3, CirclePlus, Search } from "lucide-react";
import { useKyfiLanguage } from "@/components/kyfi/language-provider";

export default function DashboardPage() {
  const { t } = useKyfiLanguage();
  const features = [
    {
      icon: <Search className="h-5 w-5" />,
      title: t("dashboard.feature1.title"),
      description: t("dashboard.feature1.description"),
      descriptionContent: (
        <div className="space-y-3 font-manrope">
          <div>
            <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-amber-700">
              {t("dashboard.feature1.oldHeading")}
            </p>
            <p className="mt-1 text-[0.88rem] leading-6 text-slate-600 sm:text-[0.95rem] sm:leading-7">
              {t("dashboard.feature1.oldDescription")}
            </p>
          </div>
          <div>
            <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-emerald-700">
              {t("dashboard.feature1.newHeading")}
            </p>
            <p className="mt-1 text-[0.88rem] leading-6 text-slate-600 sm:text-[0.95rem] sm:leading-7">
              {t("dashboard.feature1.newDescription")}
            </p>
          </div>
        </div>
      ),
      href: "/search-farmer-status",
    },
    {
      icon: <CirclePlus className="h-5 w-5" />,
      title: t("dashboard.feature2.title"),
      description: t("dashboard.feature2.description"),
      descriptionContent: (
        <div className="space-y-3 font-manrope">
          <div>
            <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-emerald-700">
              {t("dashboard.feature2.newHeading")}
            </p>
            <p className="mt-1 text-[0.88rem] leading-6 text-slate-600 sm:text-[0.95rem] sm:leading-7">
              {t("dashboard.feature2.newDescription")}
            </p>
          </div>
          <div>
            <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-amber-700">
              {t("dashboard.feature2.oldHeading")}
            </p>
            <p className="mt-1 text-[0.88rem] leading-6 text-slate-600 sm:text-[0.95rem] sm:leading-7">
              {t("dashboard.feature2.oldDescription")}
            </p>
          </div>
        </div>
      ),
      href: "/add-farmer-status",
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: t("dashboard.feature6.title"),
      description: t("dashboard.feature6.description"),
      descriptionContent: (
        <div className="space-y-3 font-manrope">
          <div>
            <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-emerald-700">
              {t("dashboard.feature6.newHeading")}
            </p>
            <p className="mt-1 text-[0.88rem] leading-6 text-slate-600 sm:text-[0.95rem] sm:leading-7">
              {t("dashboard.feature6.newDescription")}
            </p>
          </div>
          <div>
            <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-amber-700">
              {t("dashboard.feature6.oldHeading")}
            </p>
            <p className="mt-1 text-[0.88rem] leading-6 text-slate-600 sm:text-[0.95rem] sm:leading-7">
              {t("dashboard.feature6.oldDescription")}
            </p>
          </div>
          <div>
            <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-sky-700">
              {t("dashboard.feature6.votesHeading")}
            </p>
            <p className="mt-1 text-[0.88rem] leading-6 text-slate-600 sm:text-[0.95rem] sm:leading-7">
              {t("dashboard.feature6.votesDescription")}
            </p>
          </div>
        </div>
      ),
      href: "/my-records",
    },
  ];
  return (
    <AuthGuard>
      <main className="min-h-screen kyfi-shell">
        <Header />
        <HeroBanner />

        <section
          id="features"
          className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-18"
        >
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

          <div className="mt-6 grid grid-cols-2 gap-3 md:mt-8 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} {...feature} index={index} />
            ))}
          </div>
        </section>

        <div className="hidden md:block">
          <DashboardPreview />
        </div>

        <HowItWorks />

        <section
          id="status"
          className="mx-auto max-w-7xl px-4 pt-4 pb-8 sm:px-6 sm:pt-10 sm:pb-14 lg:px-8 lg:pt-12 lg:pb-16"
        >
          <div className="max-w-3xl">
            <p className="kyfi-section-kicker">
              {t("dashboard.newFarmerStatusKicker")}
            </p>
            <h2 className="mt-4 font-manrope text-[clamp(1.9rem,3vw,3rem)] font-extrabold tracking-[-0.04em] text-slate-900">
              {t("dashboard.newFarmerStatusTitle")}
            </h2>
            <p className="mt-4 max-w-2xl text-[1rem] leading-8 text-slate-600">
              {t("dashboard.newFarmerStatusDescription")}
            </p>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-1.5 md:gap-5">
            <StatusCard
              status="GREEN"
              title={t("search.legendGreen")}
              text={t("dashboard.statusGreenText")}
              index={0}
            />
            <StatusCard
              status="YELLOW"
              title={t("search.legendYellow")}
              text={t("dashboard.statusYellowText")}
              index={1}
            />
            <StatusCard
              status="RED"
              title={t("search.legendRed")}
              text={t("dashboard.statusRedText")}
              index={2}
            />
          </div>
        </section>

        <div className="hidden md:block">
          <CTASection />
        </div>

        <Footer />
      </main>
    </AuthGuard>
  );
}
