"use client";

import { CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const planPoints = [
  "Farmer search, status updates, and records",
  "Mandal and village dependent workflows",
  "Old and new farmer separation",
];

export default function SubscriptionPage() {
  return (
    <main className="h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#eff8f2_0%,_#f8f7f4_45%,_#edf2eb_100%)] px-4 py-4 sm:px-6 lg:px-8">
      <section className="flex h-full items-center justify-center">
        <Card className="w-full max-w-3xl overflow-hidden rounded-[32px] border-emerald-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <CardContent className="p-5 sm:p-6 lg:p-7">
            <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-[0.72rem] font-black uppercase tracking-[0.22em] text-emerald-800">
                <Sparkles className="h-4 w-4" />
                Subscription
              </div>

              <h1 className="mt-3 font-manrope text-3xl font-black tracking-[-0.05em] text-slate-950 sm:text-4xl">
                One Year Plan
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                Simple yearly subscription for KYFI dealers. One clear plan, one
                price, and one button to continue.
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-3 rounded-[24px] border border-emerald-100 bg-emerald-50 px-4 py-3">
                <span className="text-[0.72rem] font-black uppercase tracking-[0.22em] text-emerald-700">
                  Price
                </span>
                <span className="font-manrope text-2xl font-black tracking-[-0.05em] text-slate-950">
                  ₹1,999
                </span>
                <span className="text-sm font-semibold text-slate-500">
                  / 1 year
                </span>
              </div>

              <div className="mt-4 w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-left">
                <p className="text-[0.72rem] font-black uppercase tracking-[0.22em] text-emerald-700">
                  Key points
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {planPoints.map((point) => (
                    <div
                      key={point}
                      className="flex items-start gap-2 rounded-[18px] bg-white px-3 py-2"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <p className="text-xs leading-5 text-slate-700 sm:text-sm">
                        {point}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 w-full rounded-[24px] border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-left">
                <p className="text-[0.72rem] font-black uppercase tracking-[0.22em] text-emerald-700">
                  Project access
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  Subscribe to unlock farmer tools and your records dashboard.
                </p>
              </div>

              <div className="mt-4 w-full">
                <Button
                  type="button"
                  className="h-12 w-full rounded-full !bg-[rgb(4,120,87)] !text-white hover:brightness-105"
                >
                  Subscribe Now
                </Button>
                <p className="mt-2 text-center text-xs leading-5 text-slate-500">
                  Static design only for now. Payment can be connected later.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
