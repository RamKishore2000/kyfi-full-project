"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BlacklistWarning } from "@/components/kyfi/blacklist-warning";
import { Footer } from "@/components/kyfi/footer";
import { Header } from "@/components/kyfi/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  searchBlacklistEntries,
  type BlacklistEntryRecord,
} from "@/lib/api/blacklist";

export default function BlacklistBrowserPage() {
  const [form, setForm] = useState({
    mandal: "",
    village: "",
  });
  const [entries, setEntries] = useState<BlacklistEntryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const runSearch = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await searchBlacklistEntries({
        mandal: form.mandal.trim(),
        village: form.village.trim(),
      });

      setEntries(response.entries);
      setSearched(true);
      setMessage(response.entries.length ? null : "No record found");
    } catch (error) {
      setEntries([]);
      setSearched(true);
      setMessage(error instanceof Error ? error.message : "Unable to search blacklist");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="kyfi-shell min-h-screen">
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
              Search by mandal and village to review blacklisted farmer records.
            </p>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              whileHover={{ y: -4 }}
            >
              <Card className="overflow-hidden border-red-200/80 bg-white/85 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                <CardContent className="space-y-4 p-6">
                  <BlacklistWarning />
                  <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="font-manrope type-nav text-slate-800">Mandal</label>
                        <Input
                          placeholder="Select or enter mandal"
                          value={form.mandal}
                          onChange={(event) =>
                            setForm((current) => ({ ...current, mandal: event.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="font-manrope type-nav text-slate-800">Village</label>
                        <Input
                          placeholder="Select or enter village"
                          value={form.village}
                          onChange={(event) =>
                            setForm((current) => ({ ...current, village: event.target.value }))
                          }
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button className="w-full sm:w-auto" size="lg" onClick={runSearch} disabled={loading}>
                        {loading ? "Searching..." : "Search blacklist"}
                      </Button>
                    </div>
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
              <Card className="overflow-hidden border-red-200/80 bg-white/85 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-manrope type-small uppercase tracking-[0.2em] text-red-700">
                        Search results
                      </p>
                      <h2 className="mt-2 font-manrope type-card text-slate-900">
                        Blacklisted records
                      </h2>
                    </div>
                    <Badge variant="destructive">{entries.length} found</Badge>
                  </div>

                  {message ? (
                    <div
                      className={[
                        "rounded-2xl p-4",
                        message === "No record found"
                          ? "border border-slate-200 bg-slate-50"
                          : "border border-red-200 bg-red-50",
                      ].join(" ")}
                    >
                      <p
                        className={[
                          "font-manrope type-body",
                          message === "No record found" ? "text-slate-700" : "text-red-700",
                        ].join(" ")}
                      >
                        {message}
                      </p>
                    </div>
                  ) : null}

                  {searched && entries.length ? (
                    <div className="space-y-3">
                      {entries.map((entry) => (
                        <div key={entry.id} className="rounded-2xl border border-red-100 bg-red-50 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="font-manrope type-card text-slate-900">{entry.farmerName}</p>
                              <p className="font-manrope type-body text-slate-700">
                                {entry.village}, {entry.mandal}
                              </p>
                              <p className="mt-1 font-manrope type-small text-slate-500">
                                District: {entry.district}
                              </p>
                            </div>
                            <Badge variant="destructive">BLACKLISTED</Badge>
                          </div>
                          <p className="mt-3 font-manrope type-body text-slate-600">
                            Masked Aadhaar: {entry.aadhaarMasked}
                          </p>
                          <p className="mt-2 font-manrope type-body text-slate-700">
                            Reason: {entry.reason}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}
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

