"use client";

import { motion } from "framer-motion";
import { useKyfiLanguage } from "@/components/kyfi/language-provider";
import { Card, CardContent } from "@/components/ui/card";
import {
  FolderOpen,
  ListChecks,
  Search,
  FilePlus2,
  UserCog,
} from "lucide-react";

export function DashboardPreview() {
  const { t } = useKyfiLanguage();
  const quickActions = [
    { icon: Search, label: t("hero.ctaSearch") },
    { icon: FilePlus2, label: t("hero.ctaAdd") },
    { icon: FolderOpen, label: t("menu.profile") },
    { icon: UserCog, label: t("menu.settings") },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        className="w-full"
      >
        <Card className="overflow-hidden border-emerald-100 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
          <CardContent className="space-y-6 p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
                  {t("preview.badge")}
                </p>
                <h3 className="mt-2 font-manrope text-[1.4rem] font-extrabold tracking-[-0.04em] text-white">
                  {t("preview.title")}
                </h3>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-manrope text-[1.06rem] font-bold tracking-[-0.02em] text-white">
                    {t("preview.name")}
                  </p>
                  <p className="text-sm text-slate-300">
                    {t("preview.location")}
                  </p>
                </div>
                <div className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">
                  {t("preview.oldFarmer")}
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
                    {t("preview.maskedAadhaar")}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    XXXX XXXX 1234
                  </p>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
                    {t("preview.voteCount")}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    12 votes
                  </p>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
                    {t("preview.votedBy")}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    3 dealers
                  </p>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
                    {t("preview.proof")}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {t("preview.proofValue")}
                  </p>
                </div>
              </div>
            </div>

            {/* <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-5">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-50">
                {t("preview.blacklistedTitle")}
              </p>
              <p className="mt-2 text-sm leading-7 text-red-50/90">
                {t("preview.blacklistedBody")}
              </p>
            </div> */}
          </CardContent>
        </Card>
      </motion.div>
    </section>
  );
}
