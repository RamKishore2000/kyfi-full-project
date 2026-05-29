"use client";

import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, Search, ShieldCheck, ShieldX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    icon: ShieldCheck,
    title: "Register and get approved",
    text: "Only verified pesticide dealers can use the platform.",
  },
  {
    icon: Search,
    title: "Search a farmer profile",
    text: "Use Aadhaar, mobile, PAN, or farmer name to find the record.",
  },
  {
    icon: ShieldX,
    title: "Review status and blacklist",
    text: "Check GREEN, YELLOW, RED, and blacklist warnings together.",
  },
  {
    icon: BadgeCheck,
    title: "Make a credit decision",
    text: "Use the reputation record to decide credit terms and vote if needed.",
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        className="mb-8 max-w-2xl"
      >
        <p className="kyfi-section-kicker">How it works</p>
        <h2 className="mt-4 font-manrope text-[clamp(1.9rem,3vw,3rem)] font-extrabold tracking-[-0.04em] text-slate-900">
          A guided flow that fits dealer decision-making
        </h2>
        <p className="mt-4 max-w-2xl font-manrope text-[1rem] leading-8 text-slate-600">
          The interface stays clear and practical so small business users can move quickly from search to decision.
        </p>
      </motion.div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
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
              <Card className="h-full overflow-hidden border-white/80 bg-white/85 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                <CardContent className="space-y-5 p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="secondary">Step {index + 1}</Badge>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-manrope text-[1.08rem] font-bold tracking-[-0.02em] text-slate-900">
                      {step.title}
                    </h3>
                    <p className="font-manrope text-[0.95rem] leading-7 text-slate-600">{step.text}</p>
                  </div>

                  <div className="h-1.5 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-700"
                      style={{ width: `${(index + 1) * 25}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-5 flex items-center gap-2 font-manrope text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        <ArrowRight className="h-4 w-4 text-emerald-600" />
        Built for trust-first dealer workflows, not technical dashboards.
      </div>
    </section>
  );
}
