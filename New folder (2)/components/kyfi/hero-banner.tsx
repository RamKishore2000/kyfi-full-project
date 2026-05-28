"use client";

import { motion } from "framer-motion";
import { ArrowRight, Search, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function HeroBanner() {
  return (
    <section id="home" className="relative overflow-hidden pt-10 sm:pt-16">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-8 sm:px-6 lg:grid-cols-[1.12fr_0.88fr] lg:px-8 lg:pb-16">
        <div className="flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 font-manrope type-small text-emerald-800"
          >
            <ShieldCheck className="h-4 w-4" />
            Trusted dealer-powered credit reputation
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="font-manrope type-hero text-slate-900"
          >
            Check Farmer Credit Reputation Before Giving Credit
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.12 }}
            className="mt-5 max-w-2xl font-manrope type-body text-slate-600"
          >
            KYFI helps pesticide dealers identify trusted, delayed, and risky farmers using a shared dealer-powered reputation database.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <a
              href="/search-farmer-status"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 hover:shadow-glow"
            >
              <Search className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              Search Farmer Status
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.28 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Badge variant="secondary">Andhra Pradesh</Badge>
            <Badge variant="secondary">Telangana</Badge>
            <Badge variant="secondary">Dealer access only</Badge>
            <Badge variant="secondary">English + Telugu ready</Badge>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 36, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="relative"
        >
          <div className="absolute -left-10 top-12 h-32 w-32 rounded-full bg-emerald-200/40 blur-3xl" />
          <div className="relative overflow-hidden rounded-[1.75rem] border border-emerald-100 bg-white shadow-glow">
            <div className="relative aspect-[4/3] w-full sm:aspect-[16/10] lg:aspect-[4/5]">
              <img
                src="/hero-banner.png"
                alt="KYFI banner image"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
