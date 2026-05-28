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
    text: "Use name, mobile, PAN, or Aadhaar to find the record.",
  },
  {
    icon: ShieldX,
    title: "Review status and blacklist",
    text: "Check GREEN, YELLOW, RED, and any blacklist warning together.",
  },
  {
    icon: BadgeCheck,
    title: "Make a credit decision",
    text: "Use the information to decide credit terms and add a vote if needed.",
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
        <p className="font-manrope type-small uppercase tracking-[0.2em] text-emerald-700">
          How it works
        </p>
        <h2 className="mt-3 font-manrope type-section">
          A simple flow that fits real dealer decisions
        </h2>
        <p className="mt-4 font-manrope type-body">
          The interface stays clear and practical so small business users can move quickly from search to decision.
        </p>
      </motion.div>

      <div className="grid gap-x-8 gap-y-3 md:grid-cols-2 xl:grid-cols-4 xl:gap-x-10">
        {steps.map((step, index) => {
          const Icon = step.icon;

          return (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ delay: index * 0.05, duration: 0.35 }}
              whileHover={{ y: -4, scale: 1.01 }}
            >
              <Card className="h-full bg-white">
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="secondary">Step {index + 1}</Badge>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-manrope type-card text-slate-900">
                      {step.title}
                    </h3>
                    <p className="font-manrope type-body">{step.text}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-5 flex items-center gap-2 font-manrope type-small text-slate-500">
        <ArrowRight className="h-4 w-4 text-emerald-600" />
        Built for trust-first dealer workflows, not technical dashboards.
      </div>
    </section>
  );
}
