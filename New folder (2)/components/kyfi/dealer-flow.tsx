"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Smartphone, UserCheck, UserCog } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    icon: UserCog,
    title: "Dealer fills shop and owner details",
    text: "Basic registration starts with business and contact details.",
  },
  {
    icon: Smartphone,
    title: "OTP verification",
    text: "A one-time password confirms the mobile number.",
  },
  {
    icon: UserCheck,
    title: "Account moves to pending state",
    text: "The dealer profile is created, but access stays limited.",
  },
  {
    icon: CheckCircle2,
    title: "Approval completed",
    text: "The account is marked ready after approval is complete.",
  },
  {
    icon: CheckCircle2,
    title: "Dealer receives approval SMS and can login",
    text: "Approved dealers receive a message and can log in.",
  },
];

export function DealerFlow() {
  return (
    <section id="register" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        className="mb-8 max-w-2xl"
      >
        <p className="font-manrope type-small uppercase tracking-[0.2em] text-emerald-700">
          Dealer registration
        </p>
        <h2 className="mt-3 font-manrope type-section">
          A simple approval flow for registered pesticide dealers
        </h2>
        <p className="mt-4 font-manrope type-body">
          Dealer access is limited to approved users only. Farmers are not direct users in Version 1.
        </p>
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-5">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ delay: index * 0.06, duration: 0.35 }}
              className="relative"
            >
              <Card className="h-full bg-white">
                <CardContent className="space-y-4 p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-manrope type-small uppercase tracking-[0.18em] text-slate-500">
                      Step {index + 1}
                    </p>
                    <h3 className="font-manrope type-card text-slate-900">
                      {step.title}
                    </h3>
                    <p className="font-manrope type-body">{step.text}</p>
                  </div>
                </CardContent>
              </Card>
              {index < steps.length - 1 ? (
                <ArrowRight className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-emerald-300 lg:block" />
              ) : null}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
