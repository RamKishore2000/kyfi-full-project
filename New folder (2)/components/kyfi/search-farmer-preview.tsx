"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function SearchFarmerPreview() {
  return (
    <section id="search" className="mx-auto max-w-7xl px-2  sm:px-2 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.45 }}
        className="mb-8 max-w-2xl"
      >
        <p className="font-manrope type-small uppercase tracking-[0.2em] text-emerald-700">
          Farmer search
        </p>
        <h2 className="mt-3 font-manrope type-section">
          Search farmer status with masked personal data
        </h2>
        <p className="mt-4 font-manrope type-body">
          Aadhaar is never shown fully. The UI only displays the last four digits in the format XXXX XXXX 1234.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.5 }}
        whileHover={{ y: -4 }}
      >
      <Card className="bg-white">
        <CardContent className="space-y-5 p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex-1">
              <div className="relative">
                <Input
                  placeholder="Search by Aadhaar, PAN, Mobile, or Farmer Name"
                  aria-label="Search farmer"
                  className="h-12 pr-24"
                />
                <Button className="absolute right-1.5 top-1.5 h-9 px-4">Search</Button>
              </div>
            </div>
            <Badge variant="secondary" className="justify-center px-4 py-2">
              English + Telugu support ready
            </Badge>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl bg-slate-50 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-manrope type-card text-slate-900">
                    Suresh Reddy
                  </p>
                  <p className="font-manrope type-body">
                    Maddur Village, Guntur Rural Mandal
                  </p>
                </div>
                <Badge variant="success">GREEN</Badge>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white p-4">
                  <p className="font-manrope type-small">Masked Aadhaar</p>
                  <p className="mt-1 font-manrope type-body font-semibold text-slate-900">
                    XXXX XXXX 1234
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <p className="font-manrope type-small">Vote count</p>
                  <p className="mt-1 font-manrope type-body font-semibold text-slate-900">
                    12 votes
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <p className="font-manrope type-small">Date added</p>
                  <p className="mt-1 font-manrope type-body font-semibold text-slate-900">
                    26 May 2026
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <p className="font-manrope type-small">Remarks</p>
                  <p className="mt-1 font-manrope type-body font-semibold text-slate-900">
                    Pays after harvest cycle
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
                <p className="font-manrope type-nav text-amber-900">
                  Farmer status can be GREEN, YELLOW, or RED.
                </p>
                <p className="mt-1 font-manrope type-body text-amber-900/85">
                  Blacklist is separate from status, so both checks should be reviewed together.
                </p>
              </div>
              <div className="rounded-3xl border border-red-200 bg-red-50 p-5">
                <p className="font-manrope type-nav text-red-900">
                  BLACKLISTED
                </p>
                <p className="mt-1 font-manrope type-body text-red-900/85">
                  This farmer has been reported for confirmed unpaid dues by one or more dealers.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </motion.div>
    </section>
  );
}
