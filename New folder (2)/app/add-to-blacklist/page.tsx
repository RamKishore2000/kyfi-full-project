"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/kyfi/header";
import { Footer } from "@/components/kyfi/footer";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function AddToBlacklistPage() {
  const [aadhaar, setAadhaar] = useState("");

  const existingEntry = aadhaar.replace(/\s/g, "").endsWith("1234");

  return (
    <main className="min-h-screen">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-8 max-w-3xl"
        >
          <p className="font-manrope type-small uppercase tracking-[0.2em] text-emerald-700">
            Highest-risk action
          </p>
          <h1 className="mt-3 font-manrope type-section text-slate-900">
            Add to Blacklist
          </h1>
          <p className="mt-4 font-manrope type-body">
            Create a confirmed unpaid dues warning for a farmer. This is separate from GREEN, YELLOW, and RED status.
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            whileHover={{ y: -4 }}
          >
          <Card className="bg-white">
            <CardContent className="space-y-6 p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-manrope type-nav text-slate-900">Blacklist entry form</p>
                  <p className="mt-1 font-manrope type-body">
                    PAN is not required here. Aadhaar is the primary identifier.
                  </p>
                </div>
                <Badge variant="destructive">Confirmed unpaid dues</Badge>
              </div>

              <Alert variant="destructive">
                Blacklist is stronger than normal status and must stay separate. A farmer can still be GREEN overall and be blacklisted.
              </Alert>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="font-manrope type-nav text-slate-800">Farmer name</label>
                  <Input placeholder="Enter farmer name" />
                </div>

                <div className="space-y-2">
                  <label className="font-manrope type-nav text-slate-800">Aadhaar number</label>
                  <Input
                    placeholder="XXXX XXXX 1234"
                    value={aadhaar}
                    onChange={(event) => setAadhaar(event.target.value)}
                    inputMode="numeric"
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-manrope type-nav text-slate-800">Mandal</label>
                  <Input placeholder="Enter mandal" />
                </div>

                <div className="space-y-2">
                  <label className="font-manrope type-nav text-slate-800">Village</label>
                  <Input placeholder="Enter village" />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="font-manrope type-nav text-slate-800">Reason</label>
                  <textarea
                    placeholder="Explain the confirmed unpaid dues reason"
                    className="min-h-[120px] w-full rounded-xl border border-input bg-background px-4 py-3 font-manrope type-body text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="font-manrope type-nav text-slate-800">
                    Address <span className="text-slate-400">(optional)</span>
                  </label>
                  <Input placeholder="Optional address for reference" />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button className="sm:w-auto" size="lg">
                  Add blacklist entry
                </Button>
                <Button variant="outline" size="lg">
                  Save warning
                </Button>
              </div>
            </CardContent>
          </Card>
          </motion.div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.12 }}
              whileHover={{ y: -4 }}
            >
            <Card className="bg-white">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-manrope type-nav text-slate-900">Rules</p>
                    <h2 className="mt-1 font-manrope type-card text-slate-900">
                      Blacklist guidance
                    </h2>
                  </div>
                  <Badge variant="secondary">Dealer view</Badge>
                </div>
                <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                  <p className="font-manrope type-nav text-red-900">
                    Blacklist is for confirmed unpaid dues.
                  </p>
                </div>
                <ul className="space-y-3 font-manrope type-body text-slate-600">
                  <li>It should still show even if the farmer is GREEN overall.</li>
                  <li>Only admin can remove a blacklist entry.</li>
                  <li>Do not confuse blacklist with status color.</li>
                  <li>Duplicate entries are blocked by Aadhaar.</li>
                </ul>
              </CardContent>
            </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.18 }}
              whileHover={{ y: -4 }}
            >
            <Card className="bg-white">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-manrope type-nav text-slate-900">Duplicate check</p>
                    <h2 className="mt-1 font-manrope type-card text-slate-900">
                      Existing blacklist entry
                    </h2>
                  </div>
                  <Badge variant={existingEntry ? "warning" : "secondary"}>
                    {existingEntry ? "Already exists" : "No match"}
                  </Badge>
                </div>

                {existingEntry ? (
                  <>
                    <Alert variant="destructive">
                      Aadhaar match found. Show the existing blacklist entry instead of creating a duplicate.
                    </Alert>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="font-manrope type-small">Farmer</p>
                        <p className="mt-1 font-manrope type-nav text-slate-900">Suresh Reddy</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="font-manrope type-small">Status</p>
                        <Badge variant="success" className="mt-1">
                          GREEN
                        </Badge>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="font-manrope type-small">Mandal</p>
                        <p className="mt-1 font-manrope type-nav text-slate-900">Guntur Rural</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="font-manrope type-small">Aadhaar</p>
                        <p className="mt-1 font-manrope type-nav text-slate-900">XXXX XXXX 1234</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-manrope type-body text-slate-600">
                      No existing blacklist entry found yet. Enter a confirmed unpaid dues record carefully.
                    </p>
                  </div>
                )}
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
