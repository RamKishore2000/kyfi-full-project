"use client";

import { motion } from "framer-motion";
import { LockKeyhole, PhoneCall } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useKyfiLanguage } from "@/components/kyfi/language-provider";

export function CTASection() {
  const { t } = useKyfiLanguage();

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
      >
        <Card className="overflow-hidden border-emerald-100 bg-[linear-gradient(135deg,#0f172a_0%,#14532d_55%,#166534_100%)] text-white shadow-[0_24px_80px_rgba(15,23,42,0.2)]">
          <CardContent className="grid gap-8 p-8 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
            <div className="space-y-5">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-200">
                {t("hero.dealerAccess")}
              </p>
              <h2 className="max-w-2xl font-manrope text-[clamp(1.9rem,3vw,3rem)] font-extrabold leading-tight tracking-[-0.04em] text-white">
                {t("hero.title")}
              </h2>
              <p className="max-w-2xl text-[1rem] leading-8 text-emerald-50/90">
                {t("hero.subtitle")}
              </p>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
                <LockKeyhole className="h-5 w-5 text-emerald-200" />
                <p className="mt-3 text-sm font-bold uppercase tracking-[0.18em] text-white">
                  {t("cta.dealerOnly")}
                </p>
                <p className="mt-2 text-sm leading-7 text-emerald-50/85">
                  {t("cta.dealerOnlyBody")}
                </p>
              </div>
              <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
                <PhoneCall className="h-5 w-5 text-emerald-200" />
                <p className="mt-3 text-sm font-bold uppercase tracking-[0.18em] text-white">
                  {t("footer.support")}
                </p>
                <p className="mt-2 text-sm leading-7 text-emerald-50/85">
                  {t("hero.teluguReady")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </section>
  );
}
