"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  FolderOpen,
  ListChecks,
  Search,
  ShieldAlert,
  FilePlus2,
  UserCog,
} from "lucide-react";

const quickActions = [
  { icon: Search, label: "Search Farmer Status" },
  { icon: ShieldAlert, label: "View Blacklist" },
  { icon: FilePlus2, label: "Add Farmer Status" },
  { icon: ListChecks, label: "Add to Blacklist" },
  { icon: FolderOpen, label: "My Records" },
  { icon: UserCog, label: "Profile / Settings" },
];

export function DashboardPreview() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]"
      >
        <Card className="bg-white">
          <CardContent className="space-y-5 p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-manrope type-small uppercase tracking-[0.2em] text-emerald-700">
                  Dealer dashboard
                </p>
                <h3 className="mt-2 font-manrope type-card text-slate-900">
                  Quick access tools
                </h3>
              </div>
              <Badge variant="secondary">Approved dealer</Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <div
                    key={action.label}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-slate-50 px-4 py-3 transition hover:border-primary/30 hover:bg-primary/5"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="font-manrope type-nav text-slate-700">
                      {action.label}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="font-manrope type-nav text-emerald-900">
                Platform rule
              </p>
              <p className="mt-1 font-manrope type-body text-emerald-800">
                Only registered and approved pesticide dealers can access the platform. Farmers are not direct users in Version 1.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-glow">
          <CardContent className="space-y-6 p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-manrope type-small uppercase tracking-[0.2em] text-emerald-300">
                  Dealer UI preview
                </p>
                <h3 className="mt-2 font-manrope type-card text-white">
                  Search farmer and review key details
                </h3>
              </div>
              <Badge variant="outline" className="border-white/20 bg-white/10 text-white">
                Telugu ready
              </Badge>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-manrope type-card text-white">
                    Suresh Reddy
                  </p>
                  <p className="font-manrope type-body text-slate-300">
                    Maddur Village, Guntur Rural Mandal
                  </p>
                </div>
                <Badge variant="success">GREEN</Badge>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="font-manrope type-small text-slate-300">Masked Aadhaar</p>
                  <p className="mt-1 font-manrope type-body font-semibold text-white">
                    XXXX XXXX 1234
                  </p>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="font-manrope type-small text-slate-300">Vote count</p>
                  <p className="mt-1 font-manrope type-body font-semibold text-white">
                    12 votes
                  </p>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="font-manrope type-small text-slate-300">Date added</p>
                  <p className="mt-1 font-manrope type-body font-semibold text-white">
                    26 May 2026
                  </p>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="font-manrope type-small text-slate-300">Remarks</p>
                  <p className="mt-1 font-manrope type-body font-semibold text-white">
                    Pays after harvest cycle
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4">
              <p className="font-manrope type-nav text-red-50">
                BLACKLISTED: This farmer has been reported by one or more dealers for confirmed unpaid dues.
              </p>
              <p className="mt-1 font-manrope type-body text-red-50/90">
                Blacklist is separate from status. Review both before extending credit.
              </p>
            </div>

            <Button variant="outline" className="border-white/15 bg-white/10 text-white hover:bg-white/15">
              View full search result
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </section>
  );
}
