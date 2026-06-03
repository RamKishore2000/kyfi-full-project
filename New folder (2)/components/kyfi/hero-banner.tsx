"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Search, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fetchSiteBanner, type SiteBannerRecord } from "@/lib/api/site-banner";
import { useKyfiLanguage } from "@/components/kyfi/language-provider";

export function HeroBanner() {
  const { t, language } = useKyfiLanguage();
  const [banner, setBanner] = useState<SiteBannerRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    fetchSiteBanner()
      .then((response) => {
        if (!mounted) return;
        setBanner(response.banner);
      })
      .catch(() => {
        if (!mounted) return;
        setBanner(null);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const desktopImage = banner?.desktopImageUrl || "/hero-banner.png";
  const mobileImage = banner?.mobileImageUrl || desktopImage;
  const heroTitle =
    language === "te" ? (
      <>
        <span className="block whitespace-nowrap">
          రైతు క్రెడిట్ ప్రతిష్టను చూడండి
        </span>
        <span className="block whitespace-nowrap">రుణం ఇవ్వడానికి ముందు</span>
      </>
    ) : (
      <>
        <span className="block whitespace-nowrap">
          Check Farmer Credit Reputation
        </span>
        <span className="block whitespace-nowrap">Before Giving Credit</span>
      </>
    );
  const highlights = [
    {
      label: "GREEN",
      value: "Safe to extend credit",
      tone: "green",
    },
    {
      label: "YELLOW",
      value: "Proceed with caution",
      tone: "yellow",
    },
    {
      label: "RED",
      value: "Avoid credit",
      tone: "red",
    },
  ];

  return (
    <section
      id="home"
      className="relative overflow-hidden bg-[#F5F5F5] pt-4 sm:pt-12"
    >
      <div className="mx-auto max-w-7xl px-4 pb-2 sm:px-6 lg:px-8 lg:pb-14">
        <div className="lg:hidden">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-6"
          >
            <div className="mb-5 space-y-4">
              <div className="kyfi-section-kicker w-fit border-emerald-200/70 bg-white/85 text-emerald-800 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
                <ShieldCheck className="h-4 w-4" />
                {t("hero.kicker")}
              </div>

              <h1
                className="max-w-4xl font-manrope text-[44px] font-bold leading-[1.08] tracking-[0.005em] text-slate-950"
                style={{
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                {heroTitle}
              </h1>

              <p className="max-w-xl font-manrope text-[0.98rem] leading-7 text-slate-600">
                {t("hero.subtitle")}
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/search-farmer-status"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#047857_0%,#0f766e_100%)] px-6 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(4,120,87,0.28)]"
                >
                  <Search className="h-4 w-4" />
                  {t("hero.ctaSearch")}
                </Link>
                <Link
                  href="/add-farmer-status"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/90 px-6 text-sm font-semibold text-slate-800 shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
                >
                  {t("hero.ctaAdd")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] border border-white/70 shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={loading ? "/hero-banner.png" : mobileImage}
                alt={t("hero.title")}
                className="block h-auto w-full object-contain"
              />
            </div>
          </motion.div>
        </div>

        <div className="hidden gap-8 lg:grid lg:grid-cols-[1.06fr_0.94fr]">
          <div className="flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="kyfi-section-kicker mb-5 w-fit border-emerald-200/70 bg-white/85 text-emerald-800 shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
            >
              <ShieldCheck className="h-4 w-4" />
              {t("hero.kicker")}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="max-w-4xl font-manrope text-[44px] font-bold leading-[1.08] tracking-[0.005em] text-slate-950"
              style={{
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              {heroTitle}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="mt-5 max-w-2xl font-manrope text-[1rem] leading-8 text-slate-600 sm:text-[1.06rem]"
            >
              {t("hero.subtitle")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.16 }}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <Link
                href="/search-farmer-status"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#047857_0%,#0f766e_100%)] px-6 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(4,120,87,0.28)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(4,120,87,0.34)]"
              >
                <Search className="h-4 w-4" />
                {t("hero.ctaSearch")}
              </Link>
              <Link
                href="/add-farmer-status"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/90 px-6 text-sm font-semibold text-slate-800 shadow-[0_10px_24px_rgba(15,23,42,0.06)] backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white"
              >
                {t("hero.ctaAdd")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.24 }}
              className="mt-8 grid gap-3 sm:grid-cols-3"
            >
              {highlights.map((item) => (
                <div
                  key={item.label}
                  className={[
                    "rounded-[1.4rem] border p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur",
                    "border-slate-200 bg-white/90",
                  ].join(" ")}
                >
                  <p
                    className={[
                      "text-[0.68rem] font-black uppercase tracking-[0.2em]",
                      "text-slate-900",
                    ].join(" ")}
                  >
                    {item.label}
                  </p>
                  <p
                    className={[
                      "mt-2 font-manrope text-[0.95rem] font-semibold",
                      "text-slate-900",
                    ].join(" ")}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.3 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Badge
                variant="secondary"
                className="rounded-full border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-800"
              >
                {t("hero.dealerAccess")}
              </Badge>
              <Badge
                variant="secondary"
                className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700"
              >
                {t("hero.teluguReady")}
              </Badge>
              <Badge
                variant="secondary"
                className="rounded-full border-emerald-200 bg-white px-3 py-1.5 text-emerald-800"
              >
                {t("hero.maskedAadhaar")}
              </Badge>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 34, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="relative"
          >
            <div className="absolute -left-8 top-10 h-28 w-28 rounded-full bg-[rgb(4,120,87)]/14 blur-3xl" />
            <div className="absolute -right-6 top-1/2 h-24 w-24 rounded-full bg-[rgb(4,120,87)]/10 blur-3xl" />

            <div className="kyfi-panel relative overflow-hidden rounded-none border-0 shadow-[0_30px_90px_rgba(15,23,42,0.14)]">
              <div className="relative aspect-[5/6] w-full sm:aspect-[4/5] lg:aspect-[5/6]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={desktopImage}
                  alt="KYFI banner image"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
