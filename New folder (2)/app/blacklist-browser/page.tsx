"use client";

import { motion } from "framer-motion";
import { BlacklistWarning } from "@/components/kyfi/blacklist-warning";
import { Footer } from "@/components/kyfi/footer";
import { Header } from "@/components/kyfi/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function BlacklistBrowserPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-8 max-w-2xl"
          >
            <p className="font-manrope type-small uppercase tracking-[0.2em] text-emerald-700">
              Blacklist browser
            </p>
            <h1 className="mt-3 font-manrope type-section text-slate-900">
              Review confirmed non-payment records
            </h1>
            <p className="mt-4 font-manrope type-body">
              This page keeps the blacklist view separate from regular farmer status.
            </p>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              whileHover={{ y: -4 }}
            >
            <Card className="border-red-200 bg-white">
         
              <CardContent className="space-y-4 p-6">
                     <BlacklistWarning />
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="font-manrope type-nav text-slate-800">Mandal</label>
                      <Input placeholder="Select or enter mandal" />
                    </div>
                    <div className="space-y-2">
                      <label className="font-manrope type-nav text-slate-800">Village</label>
                      <Input placeholder="Select or enter village" />
                    </div>
                  </div>
                  <Button className="w-full sm:w-auto" size="lg">
                    Search blacklist
                  </Button>
                </div>
                
                
              </CardContent>
            </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.12 }}
              whileHover={{ y: -4 }}
            >
            <Card className="border-red-200 bg-white">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-manrope type-small uppercase tracking-[0.2em] text-red-700">
                      Sample blacklist rows
                    </p>
                    <h2 className="mt-2 font-manrope type-card text-slate-900">
                      Blacklisted records
                    </h2>
                  </div>
                  <Badge variant="destructive">Confirmed</Badge>
                </div>

                <div className="space-y-3">
                  {[
                    ["N. Ramesh", "Maddur", "Guntur Rural", "XXXX XXXX 5678"],
                    ["M. Lakshmi", "Pedavadlapudi", "Mangalagiri", "XXXX XXXX 8921"],
                    ["K. Suresh", "Bheemunipatnam", "Visakhapatnam Rural", "XXXX XXXX 4410"],
                  ].map(([name, village, mandal, aadhaar]) => (
                    <div key={name} className="rounded-2xl border border-red-100 bg-red-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-manrope type-card text-slate-900">{name}</p>
                          <p className="font-manrope type-body">
                            {village}, {mandal}
                          </p>
                        </div>
                        <Badge variant="destructive">BLACKLISTED</Badge>
                      </div>
                      <p className="mt-3 font-manrope type-body text-slate-600">
                        Masked Aadhaar: {aadhaar}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            </motion.div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
