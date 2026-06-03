"use client";

import { motion } from "framer-motion";
import { useKyfiLanguage } from "@/components/kyfi/language-provider";
import {
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  ChevronRight,
  Search,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

function DesktopConnector() {
  return (
    <div className="relative flex min-h-[250px] items-center justify-center">
      <div className="absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-emerald-200">
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute inset-0 origin-left rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600"
        />
      </div>
      <ChevronRight
        className="absolute right-[-14px] top-1/2 h-[32px] w-[32px] -translate-y-1/2 text-emerald-600"
        strokeWidth={3}
      />
    </div>
  );
}

function MobileConnector() {
  return (
    <div className="relative flex h-28 items-stretch justify-center">
      <div className="absolute left-1/2 top-0 h-full w-[6px] -translate-x-1/2 overflow-hidden rounded-full bg-emerald-200">
        <motion.div
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
          className="absolute inset-0 origin-top rounded-full bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-600"
        />
        <motion.div
          initial={{ y: "-120%", opacity: 0.15 }}
          whileInView={{ y: "120%", opacity: 0.65 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
          className="absolute left-0 top-0 h-10 w-full rounded-full bg-white/45 blur-sm"
        />
      </div>
      <ChevronDown
        className="absolute bottom-[-12px] left-1/2 h-11 w-11 -translate-x-1/2 text-emerald-600"
        strokeWidth={3.4}
      />
    </div>
  );
}

export function HowItWorks() {
  const { t } = useKyfiLanguage();
  const steps = [
    {
      icon: ShieldCheck,
      title: t("how.step1Title"),
      text: t("how.step1Text"),
    },
    {
      icon: Search,
      title: t("how.step2Title"),
      text: t("how.step2Text"),
    },
    {
      icon: ShieldX,
      title: t("how.step3Title"),
      text: t("how.step3Text"),
    },
    {
      icon: BadgeCheck,
      title: t("how.step4Title"),
      text: t("how.step4Text"),
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        className="mb-8 max-w-2xl"
      >
        <p className="kyfi-section-kicker">{t("how.title")}</p>
        <h2 className="mt-4 font-manrope text-[clamp(1.9rem,3vw,3rem)] font-extrabold tracking-[-0.04em] text-slate-900 lg:whitespace-nowrap">
          {t("how.subtitle")}
        </h2>
        <p className="mt-4 max-w-2xl font-manrope text-[1rem] leading-8 text-slate-600">
          {t("how.footer")}
        </p>
      </motion.div>

      <div className="flex flex-col md:hidden">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.title} className="flex flex-col items-stretch">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ delay: index * 0.06, duration: 0.35 }}
                whileHover={{ y: -4, scale: 1.01 }}
              >
                <Card className="h-full min-h-[250px] overflow-hidden border-white/80 bg-white/85 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                  <CardContent className="space-y-4 p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant="secondary">Step {index + 1}</Badge>
                    </div>

                    <div className="space-y-2">
                      <h3 className="max-w-[12ch] font-manrope text-[0.98rem] font-bold tracking-[-0.02em] text-slate-900">
                        {step.title}
                      </h3>
                      <p className="max-w-[22ch] font-manrope text-[0.85rem] leading-6 text-slate-600">
                        {step.text}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {!isLast && <MobileConnector />}
            </div>
          );
        })}
      </div>

      <div className="hidden md:grid xl:hidden grid-cols-2 gap-12">
        {steps.map((step, index) => {
          const Icon = step.icon;

          return (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ delay: index * 0.06, duration: 0.35 }}
              whileHover={{ y: -4, scale: 1.01 }}
            >
              <Card className="h-full min-h-[250px] overflow-hidden border-white/80 bg-white/85 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                <CardContent className="space-y-4 p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="secondary">Step {index + 1}</Badge>
                  </div>

                  <div className="space-y-2">
                    <h3 className="max-w-[12ch] font-manrope text-[0.98rem] font-bold tracking-[-0.02em] text-slate-900">
                      {step.title}
                    </h3>
                    <p className="max-w-[22ch] font-manrope text-[0.85rem] leading-6 text-slate-600">
                      {step.text}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="hidden xl:grid grid-cols-[minmax(0,1fr)_90px_minmax(0,1fr)_90px_minmax(0,1fr)_90px_minmax(0,1fr)] items-stretch">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ delay: 0 * 0.06, duration: 0.35 }}
          whileHover={{ y: -4, scale: 1.01 }}
        >
          <Card className="h-full min-h-[250px] overflow-hidden border-white/80 bg-white/85 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <CardContent className="space-y-4 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <Badge variant="secondary">Step 1</Badge>
              </div>
              <div className="space-y-2">
                <h3 className="max-w-[12ch] font-manrope text-[0.98rem] font-bold tracking-[-0.02em] text-slate-900">
                  {t("how.step1Title")}
                </h3>
                <p className="max-w-[22ch] font-manrope text-[0.85rem] leading-6 text-slate-600">
                  {t("how.step1Text")}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <DesktopConnector />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ delay: 1 * 0.06, duration: 0.35 }}
          whileHover={{ y: -4, scale: 1.01 }}
        >
          <Card className="h-full min-h-[250px] overflow-hidden border-white/80 bg-white/85 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <CardContent className="space-y-4 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <Search className="h-5 w-5" />
                </div>
                <Badge variant="secondary">Step 2</Badge>
              </div>
              <div className="space-y-2">
                <h3 className="max-w-[12ch] font-manrope text-[0.98rem] font-bold tracking-[-0.02em] text-slate-900">
                  {t("how.step2Title")}
                </h3>
                <p className="max-w-[22ch] font-manrope text-[0.85rem] leading-6 text-slate-600">
                  {t("how.step2Text")}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <DesktopConnector />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ delay: 2 * 0.06, duration: 0.35 }}
          whileHover={{ y: -4, scale: 1.01 }}
        >
          <Card className="h-full min-h-[250px] overflow-hidden border-white/80 bg-white/85 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <CardContent className="space-y-4 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <ShieldX className="h-5 w-5" />
                </div>
                <Badge variant="secondary">Step 3</Badge>
              </div>
              <div className="space-y-2">
                <h3 className="max-w-[12ch] font-manrope text-[0.98rem] font-bold tracking-[-0.02em] text-slate-900">
                  {t("how.step3Title")}
                </h3>
                <p className="max-w-[22ch] font-manrope text-[0.85rem] leading-6 text-slate-600">
                  {t("how.step3Text")}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <DesktopConnector />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ delay: 3 * 0.06, duration: 0.35 }}
          whileHover={{ y: -4, scale: 1.01 }}
        >
          <Card className="h-full min-h-[250px] overflow-hidden border-white/80 bg-white/85 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <CardContent className="space-y-4 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <BadgeCheck className="h-5 w-5" />
                </div>
                <Badge variant="secondary">Step 4</Badge>
              </div>
              <div className="space-y-2">
                <h3 className="max-w-[12ch] font-manrope text-[0.98rem] font-bold tracking-[-0.02em] text-slate-900">
                  {t("how.step4Title")}
                </h3>
                <p className="max-w-[22ch] font-manrope text-[0.85rem] leading-6 text-slate-600">
                  {t("how.step4Text")}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="mt-5 flex items-center gap-2 font-manrope text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        <ArrowRight className="h-4 w-4 text-emerald-600" />
        {t("how.footer")}
      </div>
    </section>
  );
}

export default HowItWorks;
