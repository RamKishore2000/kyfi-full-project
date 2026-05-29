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
        className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]"
      >
        <Card className="overflow-hidden border-white/80 bg-white/85 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <CardContent className="space-y-5 p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="kyfi-section-kicker">Dealer dashboard</p>
                <h3 className="mt-3 font-manrope text-[1.45rem] font-extrabold tracking-[-0.04em] text-slate-900">
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
                    className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3 transition hover:border-emerald-200 hover:bg-emerald-50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">{action.label}</p>
                  </div>
                );
              })}
            </div>

            <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-900">
                Platform rule
              </p>
              <p className="mt-2 text-sm leading-7 text-emerald-800">
                Only registered and approved pesticide dealers can access the platform. Farmers are not direct users in Version 1.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-emerald-100 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
          <CardContent className="space-y-6 p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
                  Dealer UI preview
                </p>
                <h3 className="mt-2 font-manrope text-[1.4rem] font-extrabold tracking-[-0.04em] text-white">
                  Search farmer and review key details
                </h3>
              </div>
              <Badge variant="outline" className="border-white/20 bg-white/10 text-white">
                Telugu ready
              </Badge>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-manrope text-[1.06rem] font-bold tracking-[-0.02em] text-white">
                    Ramesh Babu
                  </p>
                  <p className="text-sm text-slate-300">Ramapuram Village, Kovvur Mandal</p>
                </div>
                <Badge variant="success">GREEN</Badge>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">Masked Aadhaar</p>
                  <p className="mt-1 text-sm font-semibold text-white">XXXX XXXX 1234</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">Vote count</p>
                  <p className="mt-1 text-sm font-semibold text-white">12 votes</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">Date added</p>
                  <p className="mt-1 text-sm font-semibold text-white">26 May 2026</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">Remarks</p>
                  <p className="mt-1 text-sm font-semibold text-white">Pays after harvest cycle</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-5">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-50">
                BLACKLISTED
              </p>
              <p className="mt-2 text-sm leading-7 text-red-50/90">
                This farmer has been reported by one or more dealers for confirmed unpaid dues. Review both status and blacklist before extending credit.
              </p>
            </div>

            <Button
              variant="outline"
              className="border-white/15 bg-white/10 text-white hover:bg-white/15"
            >
              View full search result
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </section>
  );
}
