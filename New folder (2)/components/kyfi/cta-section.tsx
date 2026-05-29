"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, LockKeyhole, PhoneCall } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function CTASection() {
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
                Get started
              </p>
              <h2 className="max-w-2xl font-manrope text-[clamp(1.9rem,3vw,3rem)] font-extrabold leading-tight tracking-[-0.04em] text-white">
                Join KYFI and make credit decisions with more confidence
              </h2>
              <p className="max-w-2xl text-[1rem] leading-8 text-emerald-50/90">
                Built for pesticide dealers across Andhra Pradesh and Telangana, with trusted dealer approval, simple search, and clear reputation signals.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
                >
                  Register Dealer
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/search-farmer-status"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Search Farmer Status
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
                <LockKeyhole className="h-5 w-5 text-emerald-200" />
                <p className="mt-3 text-sm font-bold uppercase tracking-[0.18em] text-white">
                  Dealer access only
                </p>
                <p className="mt-2 text-sm leading-7 text-emerald-50/85">
                  Farmers are not direct users in Version 1.
                </p>
              </div>
              <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
                <PhoneCall className="h-5 w-5 text-emerald-200" />
                <p className="mt-3 text-sm font-bold uppercase tracking-[0.18em] text-white">
                  Support for dealers
                </p>
                <p className="mt-2 text-sm leading-7 text-emerald-50/85">
                  English and Telugu-friendly UI with straightforward field labels.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </section>
  );
}
