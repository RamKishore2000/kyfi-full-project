"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Fingerprint, MapPin, Phone, Search, ShieldAlert } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchFarmerStatuses } from "@/lib/api/farmer-status-search";
import type { FarmerStatusRecord } from "@/lib/api/farmer-status";
import { useKyfiLanguage } from "@/components/kyfi/language-provider";

function maskAadhaar(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 4 ? `XXXX XXXX ${digits.slice(-4)}` : "XXXX XXXX XXXX";
}

function formatDate(date: Date, language: "en" | "te") {
  return new Intl.DateTimeFormat(language === "te" ? "te-IN" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function SearchFarmerPreview() {
  const { language, t } = useKyfiLanguage();
  const [term, setTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FarmerStatusRecord[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const runSearch = async () => {
    if (!term.trim()) {
      setResults([]);
      setMessage(t("search.enterTerm"));
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await searchFarmerStatuses(term.trim());
      setResults(response.results);
      setMessage(response.results.length ? null : t("search.noRecordFound"));
    } catch (error) {
      setResults([]);
      setMessage(error instanceof Error ? error.message : t("search.unable"));
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
      <section className="space-y-8">
          <div className="space-y-4">
          <p className="kyfi-section-kicker w-fit">{t("search.title")}</p>
          <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
            <div className="space-y-3">
              <h1 className="max-w-3xl font-manrope text-[clamp(1.85rem,3.4vw,3.25rem)] font-extrabold tracking-[-0.05em] text-slate-900 lg:max-w-none lg:whitespace-nowrap">
                {t("search.heading")}
              </h1>
             
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Badge variant="secondary">{t("search.live")}</Badge>
              <Badge variant="secondary">{t("search.masked")}</Badge>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <LegendItem
              tone="success"
              label="GREEN"
              text={t("search.legendGreen")}
              helper={t("search.legendGreen")}
            />
            <LegendItem
              tone="warning"
              label="YELLOW"
              text={t("search.legendYellow")}
              helper={t("search.legendYellow")}
            />
            <LegendItem
              tone="destructive"
              label="RED"
              text={t("search.legendRed")}
              helper={t("search.legendRed")}
            />
            <LegendItem
              tone="destructive"
              label="BLACKLIST"
              text={t("search.legendBlack")}
              helper={t("search.legendBlack")}
            />
          </div>

          <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 lg:flex-row lg:items-end">
            <div className="w-full space-y-2 lg:flex-1 lg:max-w-none">
              <label className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-slate-500">
                {t("search.searchTerm")}
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  className="h-12 rounded-full border border-slate-200 bg-white pl-10 shadow-none focus:border-[rgb(4,120,87)]"
                  placeholder={t("search.placeholder")}
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

              <Button
                className="h-12 w-full rounded-full !bg-[rgb(4,120,87)] px-6 font-semibold !text-white shadow-[0_12px_24px_rgba(4,120,87,0.18)] hover:!bg-[rgb(4,120,87)] hover:brightness-110 lg:w-[220px]"
                onClick={runSearch}
                disabled={loading}
              >
              {loading ? t("search.loading") : t("search.searchButton")}
              </Button>
          </div>

          {message ? (
            <Alert
              variant={message === t("search.noRecordFound") ? "default" : "destructive"}
              className="border-slate-200 bg-white"
            >
              {message}
            </Alert>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <p className="text-[0.72rem] font-black uppercase tracking-[0.22em] text-slate-500">
              {t("search.results")}
            </p>
            <Badge variant="outline" className="border-slate-200">
              {summaryCount} {t("search.found")}
            </Badge>
          </div>

          <div className="divide-y divide-slate-200/80 border-t border-b border-slate-200/80">
              {results.map((farmer) => (
                <details key={farmer.id} className="group">
                  <summary className="grid cursor-pointer list-none gap-4 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                    <div className="min-w-0 space-y-3">
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
                        {farmer.blacklisted ? (
                          <Badge variant="destructive">{t("search.blacklisted")}</Badge>
                        ) : null}
                        {farmer.currentDealerVoted ? (
                          <Badge variant="secondary">{t("search.youAlreadyVoted")}</Badge>
                        ) : null}
                      </div>

                      <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
                        <MetaLine icon={MapPin} text={`${farmer.village}, ${farmer.mandal}`} />
                        <MetaLine icon={Phone} text={farmer.mobileNumber || "-"} />
                        <MetaLine icon={Fingerprint} text={maskAadhaar(farmer.aadhaar)} />
                        <MetaLine label={t("search.votes")} text={String(farmer.voteCount)} compact />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 self-center pt-1">
                      <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180" />
                    </div>
                  </summary>

                  <div className="pb-5">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <MiniInfo label={t("search.status")} value={farmer.statusColor} />
                      <MiniInfo label={t("search.district")} value={farmer.district} />
                      <MiniInfo label={t("search.location")} value={`${farmer.village}, ${farmer.mandal}`} />
                      <MiniInfo
                        label={t("search.dateAdded")}
                        value={formatDate(new Date(farmer.createdAt), language)}
                      />
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <MiniInfo label={t("search.remarks")} value={farmer.remarks || "-"} />
                      <MiniInfo label={t("search.maskedAadhaar")} value={maskAadhaar(farmer.aadhaar)} />
                    </div>

                    {farmer.blacklisted ? (
                      <div className="mt-4 border-l-4 border-red-500 bg-red-50 px-4 py-4">
                        <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-800">
                          {t("search.blacklisted")}
                        </p>
                        <p className="mt-2 text-sm leading-7 text-red-700">
                          {farmer.blacklistReason || t("search.blacklistWarningAttached")}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </details>
              ))}

                {!results.length && !message ? (
                <div className="px-1 py-10 text-center">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                    {t("search.empty")}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {t("search.emptyHint")}
                  </p>
                </div>
              ) : null}
          </div>
        </div>
      </section>
    </motion.div>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-slate-200 bg-white px-4 py-4">
      <p className="text-[0.78rem] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-[0.95rem] font-medium leading-7 text-slate-800">{value}</p>
    </div>
  );
}

function MetaLine({
  icon: Icon,
  text,
  label,
  compact = false,
}: {
  icon?: typeof MapPin;
  text: string;
  label?: string;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {Icon ? <Icon className="h-4 w-4 text-slate-500" /> : null}
      <span className={compact ? "text-sm font-semibold text-slate-800" : "text-sm text-slate-600"}>
        {label ? `${label}: ` : null}
        {text}
      </span>
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
