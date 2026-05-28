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

const statusOptions = [
  { value: "GREEN", label: "GREEN", tone: "success" as const },
  { value: "YELLOW", label: "YELLOW", tone: "warning" as const },
  { value: "RED", label: "RED", tone: "destructive" as const },
];

export default function AddFarmerStatusPage() {
  const [selectedStatus, setSelectedStatus] = useState("GREEN");

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
            Dealer-only record entry
          </p>
          <h1 className="mt-3 font-manrope type-section text-slate-900">
            Add Farmer Status
          </h1>
          <p className="mt-4 font-manrope type-body">
            Create a general farmer reputation record using Aadhaar as the primary identifier. This screen is not for blacklist entries.
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
                  <p className="font-manrope type-nav text-slate-900">Farmer status form</p>
                  <p className="mt-1 font-manrope type-body">
                    PAN is not required here. Use Aadhaar, mobile, mandal, and village.
                  </p>
                </div>
                <Badge variant="secondary">General status only</Badge>
              </div>

              <Alert>
                Blacklist is separate from status. This form creates only GREEN, YELLOW, or RED reputation records.
              </Alert>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="font-manrope type-nav text-slate-800">Farmer name</label>
                  <Input placeholder="Enter farmer name" />
                </div>

                <div className="space-y-2">
                  <label className="font-manrope type-nav text-slate-800">Aadhaar number</label>
                  <Input placeholder="XXXX XXXX 1234" inputMode="numeric" />
                </div>

                <div className="space-y-2">
                  <label className="font-manrope type-nav text-slate-800">Mobile number</label>
                  <Input placeholder="Enter mobile number" inputMode="tel" />
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
                  <label className="font-manrope type-nav text-slate-800">
                    Ration card / address <span className="text-slate-400">(optional)</span>
                  </label>
                  <Input placeholder="Optional address or ration card reference" />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="font-manrope type-nav text-slate-800">
                    Remarks <span className="text-slate-400">(optional)</span>
                  </label>
                  <textarea
                    placeholder="Add short notes about repayment pattern or season"
                    className="min-h-[120px] w-full rounded-xl border border-input bg-background px-4 py-3 font-manrope type-body text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <p className="font-manrope type-nav text-slate-800">Status</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSelectedStatus(option.value)}
                      className={[
                        "rounded-2xl border px-4 py-4 text-left transition",
                        selectedStatus === option.value
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border bg-slate-50 hover:border-primary/30 hover:bg-primary/5",
                      ].join(" ")}
                    >
                      <p className="font-manrope type-card text-slate-900">{option.label}</p>
                      <p className="mt-1 font-manrope type-small text-slate-500">
                        {option.value === "GREEN"
                          ? "Regular credit pattern"
                          : option.value === "YELLOW"
                            ? "Delayed repayment pattern"
                            : "High-risk repayment pattern"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button className="sm:w-auto" size="lg">
                  Add farmer status
                </Button>
                <Button variant="outline" size="lg">
                  Save status
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
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-manrope type-nav text-slate-900">Help</p>
                    <h2 className="mt-1 font-manrope type-card text-slate-900">
                      Simple record entry rules
                    </h2>
                  </div>
                  <Badge variant="secondary">Dealer view</Badge>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="font-manrope type-nav text-emerald-900">
                    PAN is not required here; use Aadhaar, mobile, mandal, and village.
                  </p>
                </div>
                <ul className="space-y-3 font-manrope type-body text-slate-600">
                  <li>Other dealers can vote once to confirm the pattern.</li>
                  <li>Admin can remove false or disputed records.</li>
                  <li>Blacklist stays separate from GREEN, YELLOW, and RED status.</li>
                  <li>Duplicate records are blocked by Aadhaar.</li>
                </ul>
              </CardContent>
            </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.18 }}
              whileHover={{ y: -4 }}
            >
            <Card className="bg-white">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-manrope type-nav text-slate-900">Duplicate check</p>
                    <h2 className="mt-1 font-manrope type-card text-slate-900">
                      Existing farmer found
                    </h2>
                  </div>
                  <Badge variant="warning">Already exists</Badge>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="font-manrope type-body text-amber-900">
                    Aadhaar match detected. Show the existing record instead of creating a duplicate.
                  </p>
                </div>
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
                    <p className="font-manrope type-small">Village</p>
                    <p className="mt-1 font-manrope type-nav text-slate-900">Maddur</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="font-manrope type-small">Votes</p>
                    <p className="mt-1 font-manrope type-nav text-slate-900">12 votes</p>
                  </div>
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
