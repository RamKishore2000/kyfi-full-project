"use client";

import { motion } from "framer-motion";
import { ArrowRight, LockKeyhole, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function CTASection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
      >
        <Card className="overflow-hidden border-emerald-100 bg-gradient-to-br from-emerald-700 via-emerald-700 to-emerald-900 text-white shadow-glow">
          <CardContent className="grid gap-8 p-8 lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
            <div className="space-y-5">
              <p className="font-manrope type-small uppercase tracking-[0.22em] text-emerald-200">
                Get started
              </p>
              <h2 className="max-w-2xl font-manrope type-section text-white">
                Join KYFI and make credit decisions with more confidence
              </h2>
              <p className="max-w-2xl font-manrope type-body text-emerald-50/90">
                Built for pesticide dealers across Andhra Pradesh and Telangana, with trusted dealer approval, simple search, and clear reputation signals.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" className="bg-white text-emerald-800 hover:bg-emerald-50">
                  Register Dealer
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 bg-white/10 text-white hover:bg-white/15"
                >
                  Search Farmer Status
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <LockKeyhole className="h-5 w-5 text-emerald-200" />
                <p className="mt-3 font-manrope type-nav text-white">
                  Dealer access only
                </p>
                <p className="mt-1 font-manrope type-body text-emerald-50/85">
                  Farmers are not direct users in Version 1.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <PhoneCall className="h-5 w-5 text-emerald-200" />
                <p className="mt-3 font-manrope type-nav text-white">
                  Support for dealers
                </p>
                <p className="mt-1 font-manrope type-body text-emerald-50/85">
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
