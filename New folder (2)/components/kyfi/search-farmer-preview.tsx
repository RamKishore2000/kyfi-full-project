"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Fingerprint, MapPin, Phone, Search, ShieldAlert } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { searchFarmerStatuses } from "@/lib/api/farmer-status-search";
import type { FarmerStatusRecord } from "@/lib/api/farmer-status";

function maskAadhaar(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 4 ? `XXXX XXXX ${digits.slice(-4)}` : "XXXX XXXX XXXX";
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function SearchFarmerPreview() {
  const [term, setTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FarmerStatusRecord[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const runSearch = async () => {
    if (!term.trim()) {
      setResults([]);
      setMessage("Enter Aadhaar number, mobile number, or farmer name.");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await searchFarmerStatuses(term.trim());
      setResults(response.results);
      setMessage(response.results.length ? null : "No record found");
    } catch (error) {
      setResults([]);
      setMessage(error instanceof Error ? error.message : "Unable to search farmer status");
    } finally {
      setLoading(false);
    }
  };

  const summaryCount = useMemo(() => results.length, [results.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <Card className="overflow-hidden border-white/80 bg-white/85 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <CardContent className="space-y-6 p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="space-y-3">
              <p className="kyfi-section-kicker w-fit">Search farmer status</p>
              <h1 className="max-w-2xl font-manrope text-[clamp(1.75rem,3vw,2.8rem)] font-extrabold tracking-[-0.04em] text-slate-900">
                Search by Aadhaar, mobile, or farmer name
              </h1>
              <p className="max-w-2xl text-[1rem] leading-8 text-slate-600">
                Find matching farmers and expand a card to review the full record, vote count, and blacklist warning in one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Badge variant="secondary">Live search</Badge>
              <Badge variant="secondary">Masked Aadhaar</Badge>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[3fr_1fr] lg:items-start">
            <div className="space-y-6">
              <div className="rounded-[1.75rem] border border-slate-200/70 bg-slate-50/90 p-4 shadow-inner">
                <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
                  <div className="space-y-2">
                    <label className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                      Search term
                    </label>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                      <Input
                        className="h-12 rounded-full border-slate-200 bg-white pl-9 shadow-sm"
                        placeholder="Aadhaar, mobile number, or farmer name"
                        value={term}
                        onChange={(event) => setTerm(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            void runSearch();
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button className="h-12 rounded-full px-6" onClick={runSearch} disabled={loading}>
                      {loading ? "Searching..." : "Search"}
                    </Button>
                  </div>
                </div>
              </div>

              {message ? (
                <Alert
                  variant={message === "No record found" ? "default" : "destructive"}
                  className="border-slate-200 bg-white"
                >
                  {message}
                </Alert>
              ) : null}

              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Search results
                </p>
                <Badge variant="outline" className="border-slate-200">
                  {summaryCount} found
                </Badge>
              </div>

              <div className="space-y-4">
                {results.map((farmer) => (
                  <details
                    key={farmer.id}
                    className="group overflow-hidden rounded-[1.5rem] border border-slate-200/70 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(15,23,42,0.1)]"
                  >
                    <summary className="grid cursor-pointer list-none gap-4 px-5 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="font-manrope text-[1.05rem] font-extrabold tracking-[-0.02em] text-slate-900">
                            {farmer.farmerName}
                          </p>
                          <Badge
                            variant={
                              farmer.statusColor === "GREEN"
                                ? "success"
                                : farmer.statusColor === "YELLOW"
                                  ? "warning"
                                  : "destructive"
                            }
                          >
                            {farmer.statusColor}
                          </Badge>
                          {farmer.blacklisted ? <Badge variant="destructive">BLACKLISTED</Badge> : null}
                          {farmer.currentDealerVoted ? <Badge variant="secondary">You already voted</Badge> : null}
                        </div>

                        <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>
                              {farmer.village}, {farmer.mandal}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{farmer.mobileNumber || "-"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Fingerprint className="h-4 w-4" />
                            <span>{maskAadhaar(farmer.aadhaar)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
                              <span className="text-[0.62rem] font-black uppercase tracking-[0.28em] text-slate-500">
                                Votes
                              </span>
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-sm font-bold text-slate-900">
                                {farmer.voteCount}
                              </span>
                            </div>
                          </div>

                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3 self-center">

                        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180" />
                      </div>
                    </summary>

                    <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-5">
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <MiniInfo label="Status" value={farmer.statusColor} />
                        <MiniInfo label="District" value={farmer.district} />
                        <MiniInfo label="Location" value={`${farmer.village}, ${farmer.mandal}`} />
                        <MiniInfo label="Date added" value={formatDate(new Date(farmer.createdAt))} />
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <MiniInfo label="Remarks" value={farmer.remarks || "-"} />
                        <MiniInfo label="Aadhaar" value={maskAadhaar(farmer.aadhaar)} />
                      </div>

                      {farmer.blacklisted ? (
                        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
                          <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-800">
                            BLACKLISTED
                          </p>
                          <p className="mt-2 text-sm leading-7 text-red-700">
                            {farmer.blacklistReason || "Blacklist warning attached"}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </details>
                ))}

                {!results.length && !message ? (
                  <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white/70 px-6 py-10 text-center shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                      Search results will appear here
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Search by Aadhaar, mobile number, or farmer name to view matching farmers.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            <aside className="space-y-4 lg:sticky lg:top-6">
              <div className="rounded-[1.5rem] border border-white/80 bg-white/90 p-5 shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Legend</p>
                <h3 className="mt-2 font-manrope text-[1.15rem] font-extrabold tracking-[-0.03em] text-slate-900">
                  Status meaning
                </h3>
                <div className="mt-4 space-y-3">
                  <LegendItem
                    tone="success"
                    label="GREEN"
                    text="Safe to extend credit"
                    helper="Good repayment record"
                  />
                  <LegendItem
                    tone="warning"
                    label="YELLOW"
                    text="Proceed with caution"
                    helper="Delayed payments seen"
                  />
                  <LegendItem
                    tone="destructive"
                    label="RED"
                    text="Avoid credit"
                    helper="Confirmed defaulter"
                  />
                  <LegendItem
                    tone="destructive"
                    label="BLACKLIST"
                    text="Separate unpaid-dues warning"
                    helper="Can appear with GREEN/YELLOW/RED"
                  />
                </div>
              </div>

                <div className="rounded-[1.5rem] border border-red-100 bg-red-50/90 p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-700">
                    Quick reminder
                  </p>
                  <p className="mt-2 text-sm leading-7 text-red-700/80">
                    BLACKLIST is separate from the status color. A farmer can still be GREEN and also show a blacklist warning.
                  </p>
                </div>
            </aside>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-[15px] font-bold tracking-[-0.02em] text-slate-700">{label}</p>
      <p className=" text-[14px] font-normal leading-7 text-slate-800">{value}</p>
    </div>
  );
}

function LegendItem({
  tone,
  label,
  text,
  helper,
}: {
  tone: "success" | "warning" | "destructive" | "neutral";
  label: string;
  text: string;
  helper: string;
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-100 bg-emerald-50/80"
      : tone === "warning"
        ? "border-amber-100 bg-amber-50/80"
        : tone === "destructive"
          ? "border-red-100 bg-red-50/80"
          : "border-slate-200 bg-slate-50/90";

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant={
            tone === "success"
              ? "success"
              : tone === "warning"
                ? "warning"
                : tone === "destructive"
                  ? "destructive"
                  : "secondary"
          }
        >
          {label}
        </Badge>
        <p className="font-manrope text-sm font-bold text-slate-900">{text}</p>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{helper}</p>
    </div>
  );
}
