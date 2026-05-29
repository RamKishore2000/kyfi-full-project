"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const highlights = [
  { label: "Approved dealers only", value: "Secure access" },
  { label: "AP + Telangana", value: "Focused coverage" },
  { label: "GREEN / YELLOW / RED", value: "Clear signals" },
];

export function HeroBanner() {
  return (
    <section id="home" className="relative overflow-hidden pt-8 sm:pt-12">
      <div className="absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(circle_at_top_left,rgba(22,101,52,0.14),transparent_34%),radial-gradient(circle_at_top_right,rgba(250,204,21,0.12),transparent_28%)]" />

      <div className="mx-auto grid max-w-7xl gap-8 px-4 pb-8 sm:px-6 lg:grid-cols-[1.06fr_0.94fr] lg:px-8 lg:pb-14">
        <div className="flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="kyfi-section-kicker mb-5 w-fit"
          >
            <ShieldCheck className="h-4 w-4" />
            Trusted dealer-powered credit reputation
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="max-w-3xl font-manrope text-[clamp(2.25rem,5vw,4.25rem)] font-extrabold leading-[1.02] tracking-[-0.05em] text-slate-900"
          >
            Check farmer credit reputation before giving credit
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="mt-5 max-w-2xl font-manrope text-[1rem] leading-8 text-slate-600 sm:text-[1.05rem]"
          >
            KYFI helps pesticide dealers identify trusted, delayed, and risky farmers using a shared dealer-powered reputation database.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.16 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <Link
              href="/search-farmer-status"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(22,101,52,0.24)] transition hover:bg-emerald-800 hover:shadow-[0_18px_38px_rgba(22,101,52,0.28)]"
            >
              <Search className="h-4 w-4" />
              Search Farmer Status
            </Link>
            <Link
              href="/add-farmer-status"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/80 px-6 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur transition hover:bg-white"
            >
              Add Farmer Status
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
                className="rounded-3xl border border-white/80 bg-white/80 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur"
              >
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{item.value}</p>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.3 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Badge variant="secondary">Dealer access only</Badge>
            <Badge variant="secondary">English + Telugu ready</Badge>
            <Badge variant="secondary">Masked Aadhaar display</Badge>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 34, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="relative"
        >
          <div className="absolute -left-8 top-10 h-28 w-28 rounded-full bg-emerald-200/40 blur-3xl" />
          <div className="absolute -right-6 top-1/2 h-24 w-24 rounded-full bg-amber-200/50 blur-3xl" />

          <div className="kyfi-panel relative overflow-hidden rounded-[2rem] border-white/70">
            <div className="relative aspect-[5/6] w-full sm:aspect-[4/5] lg:aspect-[5/6]">
              <img
                src="/hero-banner.png"
                alt="KYFI banner image"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>

            <div className="absolute inset-x-4 bottom-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-[0_14px_40px_rgba(15,23,42,0.1)] backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Status preview</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">GREEN / YELLOW / RED + blacklist warning</p>
              </div>
              <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/90 p-4 shadow-[0_14px_40px_rgba(15,23,42,0.08)] backdrop-blur">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">
                  <Sparkles className="h-4 w-4" />
                  Premium search UX
                </p>
                <p className="mt-2 text-sm font-semibold text-emerald-950">Fast lookup for dealers before extending credit</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
