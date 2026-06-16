"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FolderOpen, Loader2, Sparkles } from "lucide-react";
import { AuthGuard } from "@/components/kyfi/auth-guard";
import { Header } from "@/components/kyfi/header";
import { Footer } from "@/components/kyfi/footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  fetchMyRecords,
  type MyBlacklistRecord,
  type MyFarmerStatusRecord,
  type MyVoteRecord,
  type MyRecordsResponse,
} from "@/lib/api/my-records";
import { useKyfiLanguage } from "@/components/kyfi/language-provider";

const tabs = [
  { key: "oldFarmers", labelKey: "myRecords.tabs.oldFarmers" },
  { key: "newFarmers", labelKey: "myRecords.tabs.newFarmers" },
  { key: "votes", labelKey: "myRecords.tabs.votes" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

function getStatusLabel(statusColor: string, t: (key: string) => string) {
  if (statusColor === "GREEN") return t("myRecords.statusGreen");
  if (statusColor === "YELLOW") return t("myRecords.statusYellow");
  return t("myRecords.statusRed");
}

function formatVoteDate(value?: string) {
  if (!value) return "";

  const localTimestamp = value.match(
    /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})/,
  );
  const parsed = localTimestamp
    ? new Date(
        Number(localTimestamp[1]),
        Number(localTimestamp[2]) - 1,
        Number(localTimestamp[3]),
        Number(localTimestamp[4]),
        Number(localTimestamp[5]),
        Number(localTimestamp[6]),
      )
    : new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(parsed);
}

function SummaryCard({
  label,
  nativeLabel,
  value,
  icon,
}: {
  label: string;
  nativeLabel: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <Card className="kyfi-record-summary-card border-white/80 bg-white/90 shadow-[0_12px_30px_rgba(15,23,42,0.07)] sm:bg-white/85 sm:shadow-[0_16px_50px_rgba(15,23,42,0.08)]">
      <CardContent className="kyfi-record-summary-content flex h-[5.5rem] items-center justify-between gap-2 p-3 sm:h-auto sm:gap-4 sm:p-5">
        <div className="min-w-0">
          <p className="kyfi-record-summary-label truncate font-manrope text-[0.52rem] font-extrabold uppercase tracking-[0.08em] text-slate-500 sm:type-small sm:tracking-[0.22em]">
            <span className="hidden kyfi-native-inline">{nativeLabel}</span>
            <span className="kyfi-browser-inline">{label}</span>
          </p>
          <p className="mt-1 font-manrope text-[1.2rem] font-black tracking-[-0.05em] text-slate-900 sm:mt-2 sm:text-[1.85rem] sm:font-extrabold">
            {value}
          </p>
        </div>
        <div className="kyfi-record-summary-icon flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 sm:h-12 sm:w-12 sm:rounded-2xl">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function FarmerRecordCard({
  record,
  t,
}: {
  record: MyFarmerStatusRecord;
  t: (key: string) => string;
}) {
  const farmerType =
    String(record.farmerType || "OLD").toUpperCase() === "NEW" ? "NEW" : "OLD";

  if (farmerType === "NEW") {
    return (
      <article className="rounded-[1.35rem] border border-white/80 bg-white/95 p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)] sm:rounded-3xl sm:bg-white/90 sm:p-5 sm:shadow-[0_16px_50px_rgba(15,23,42,0.08)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5 sm:space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-manrope text-[1rem] font-extrabold tracking-[-0.03em] text-slate-900 sm:text-[1.04rem] sm:font-bold sm:tracking-[-0.02em]">
                {record.farmerName}
              </h3>
              <Badge variant="outline">{t("myRecords.tabs.newFarmers")}</Badge>
            </div>
            <p className="font-manrope text-[0.78rem] font-semibold leading-5 text-slate-600 sm:type-small sm:text-slate-500">
              {record.district}, {record.mandal}, {record.village}
            </p>
            <p className="font-manrope text-[0.78rem] font-semibold leading-5 text-slate-500 sm:type-small">
              {t("myRecords.mobile")}:{" "}
              {record.mobileNumber || t("myRecords.notProvided")}
            </p>
          </div>
          <div className="shrink-0">
            <Badge
              variant={
                record.statusColor === "GREEN"
                  ? "success"
                  : record.statusColor === "YELLOW"
                    ? "warning"
                    : "destructive"
              }
            >
              {getStatusLabel(record.statusColor, t)}
            </Badge>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="rounded-[1.35rem] border border-white/80 bg-white/95 p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)] sm:rounded-3xl sm:bg-white/90 sm:p-5 sm:shadow-[0_16px_50px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
        <div className="space-y-1.5 sm:space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-manrope text-[1rem] font-extrabold tracking-[-0.03em] text-slate-900 sm:text-[1.04rem] sm:font-bold sm:tracking-[-0.02em]">
              {record.farmerName}
            </h3>
            <Badge variant="secondary">{t("myRecords.tabs.oldFarmers")}</Badge>
            {record.blacklisted ? (
              <Badge variant="destructive">{t("myRecords.blacklisted")}</Badge>
            ) : null}
          </div>
          <p className="font-manrope text-[0.78rem] font-semibold leading-5 text-slate-600 sm:type-small sm:text-slate-500">
            {record.district}, {record.mandal}, {record.village}
          </p>
          <p className="font-manrope text-[0.78rem] font-semibold leading-5 text-slate-500 sm:type-small">
            {t("myRecords.mobile")}:{" "}
            {record.mobileNumber || t("myRecords.notProvided")}
          </p>
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-emerald-50 px-3 py-2 text-left sm:block sm:bg-transparent sm:p-0 sm:text-right">
          <p className="font-manrope text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-emerald-700 sm:type-small sm:tracking-[0.2em] sm:text-slate-500">
            {t("myRecords.votes")}
          </p>
          <p className="font-manrope text-lg font-black text-emerald-900 sm:mt-1 sm:text-xl sm:font-extrabold sm:text-slate-900">
            {record.voteCount}
          </p>
        </div>
      </div>
    </article>
  );
}

function BlacklistRecordCard({
  record,
  t,
}: {
  record: MyBlacklistRecord;
  t: (key: string) => string;
}) {
  return (
    <details className="group rounded-3xl border border-white/80 bg-white/90 shadow-[0_16px_50px_rgba(15,23,42,0.08)]">
      <summary className="list-none cursor-pointer p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-manrope text-[1.04rem] font-bold tracking-[-0.02em] text-slate-900">
                {record.farmerName}
              </h3>
              <Badge variant="destructive">BLACKLISTED</Badge>
            </div>
            <p className="font-manrope type-small text-slate-500">
              {record.district}, {record.mandal}, {record.village}
            </p>
          </div>
          <div className="text-right">
            <p className="font-manrope type-small uppercase tracking-[0.2em] text-slate-500">
              {t("myRecords.mobile")}
            </p>
            <p className="mt-1 font-manrope text-sm font-semibold text-slate-900">
              {record.mobileNumber || t("myRecords.notProvided")}
            </p>
          </div>
        </div>
      </summary>

      <div className="border-t border-slate-100 px-5 pb-5 pt-2">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="font-manrope type-small uppercase tracking-[0.18em] text-slate-500">
              {t("myRecords.mobile")}
            </p>
            <p className="mt-2 font-manrope type-nav text-slate-900">
              {record.mobileNumber || t("myRecords.notProvided")}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="font-manrope type-small uppercase tracking-[0.18em] text-slate-500">
              {t("myRecords.reason")}
            </p>
            <p className="mt-2 font-manrope type-nav text-slate-900">
              {record.reason}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="font-manrope type-small uppercase tracking-[0.18em] text-slate-500">
              {t("myRecords.address")}
            </p>
            <p className="mt-2 font-manrope type-nav text-slate-900">
              {record.address || t("myRecords.noAddress")}
            </p>
          </div>
        </div>
      </div>
    </details>
  );
}

function VoteRecordCard({
  record,
  t,
}: {
  record: MyVoteRecord;
  t: (key: string) => string;
}) {
  return (
    <article className="rounded-[1.35rem] border border-white/80 bg-white/95 p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)] sm:rounded-3xl sm:bg-white/90 sm:p-5 sm:shadow-[0_16px_50px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
        <div className="space-y-1.5 sm:space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-manrope text-[1rem] font-extrabold tracking-[-0.03em] text-slate-900 sm:text-[1.04rem] sm:font-bold sm:tracking-[-0.02em]">
              {record.farmerName}
            </h3>
            <Badge variant="success">{t("myRecords.voted")}</Badge>
          </div>
          <p className="font-manrope text-[0.78rem] font-semibold leading-5 text-slate-600 sm:type-small sm:text-slate-500">
            {record.district}, {record.mandal}, {record.village}
          </p>
          <p className="font-manrope text-[0.78rem] font-semibold leading-5 text-slate-500 sm:type-small">
            {t("myRecords.mobile")}:{" "}
            {record.mobileNumber || t("myRecords.notProvided")}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-3 py-2 text-left sm:bg-transparent sm:p-0 sm:text-right">
          <p className="font-manrope text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-slate-500 sm:type-small sm:tracking-[0.2em]">
            {t("myRecords.votedAt")}
          </p>
          <p className="mt-1 font-manrope text-[0.78rem] font-bold leading-5 text-slate-900 sm:text-sm sm:font-semibold">
            {formatVoteDate(record.actedAt || record.votedAt) ||
              t("myRecords.notProvided")}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function MyRecordsPage() {
  const { t } = useKyfiLanguage();
  const [tab, setTab] = useState<TabKey>("oldFarmers");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [records, setRecords] = useState<MyRecordsResponse>({
    counts: {
      farmerStatuses: 0,
      blacklistEntries: 0,
      votes: 0,
      countActions: 0,
    },
    farmerStatuses: [],
    blacklistEntries: [],
    votes: [],
    countActions: [],
  });

  const farmerStatuses = records.farmerStatuses;
  const oldFarmers = farmerStatuses.filter(
    (record) => String(record.farmerType || "OLD").toUpperCase() !== "NEW",
  );
  const newFarmers = farmerStatuses.filter(
    (record) => String(record.farmerType || "OLD").toUpperCase() === "NEW",
  );
  const oldFarmerVotes = records.votes.filter(
    (record) => String(record.farmerType || "OLD").toUpperCase() !== "NEW",
  );
  const summaryCards = [
    {
      label: t("myRecords.summary.oldFarmers"),
      nativeLabel: t("myRecords.summary.oldFarmers"),
      value: String(oldFarmers.length),
      icon: <FolderOpen className="h-5 w-5" />,
    },
    {
      label: t("myRecords.summary.newFarmers"),
      nativeLabel: t("myRecords.summary.newFarmers"),
      value: String(newFarmers.length),
      icon: <Sparkles className="h-5 w-5" />,
    },
    {
      label: t("myRecords.summary.votes"),
      nativeLabel: t("myRecords.summary.votes"),
      value: String(oldFarmerVotes.length),
      icon: <Sparkles className="h-5 w-5" />,
    },
  ];

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const data = await fetchMyRecords();
        if (!mounted) return;
        setRecords(data);
      } catch (loadError) {
        if (!mounted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : t("myRecords.loadFailed"),
        );
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AuthGuard>
      <main className="min-h-screen kyfi-shell">
        <Header />

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"
          >
            <div className="max-w-3xl">
              <p className="kyfi-section-kicker">
                <span className="hidden kyfi-native-inline">Dealer activity</span>
                <span className="kyfi-browser-inline">{t("myRecords.kicker")}</span>
              </p>
              <h1 className="mt-4 font-manrope text-[clamp(2rem,4vw,3.3rem)] font-extrabold tracking-[-0.05em] text-slate-900 lg:whitespace-nowrap">
                <span className="hidden kyfi-native-inline">My Records</span>
                <span className="kyfi-browser-inline">{t("myRecords.title")}</span>
              </h1>
              <p className="mt-4 max-w-2xl text-[1rem] leading-8 text-slate-600">
                <span className="hidden kyfi-native-inline">
                  Review your old farmers, new farmers, and votes.
                </span>
                <span className="kyfi-browser-inline">{t("myRecords.description")}</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/add-farmer-status"
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 font-manrope type-button text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
              >
                {t("myRecords.addFarmer")}
              </Link>
              {/*
              <Link
                href="/add-to-blacklist"
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-emerald-700 px-5 font-manrope type-button text-white transition hover:bg-emerald-800"
              >
                {t("myRecords.addBlacklist")}
              </Link>
              */}
            </div>
          </motion.div>

          <div className="kyfi-record-summary-grid grid grid-cols-3 gap-2 sm:gap-5">
            {summaryCards.map((card) => (
              <SummaryCard
                key={card.label}
                label={card.label}
                nativeLabel={card.nativeLabel}
                value={card.value}
                icon={card.icon}
              />
            ))}
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-white/80 bg-white/85 p-2 shadow-[0_14px_34px_rgba(15,23,42,0.07)] sm:mt-8 sm:rounded-[2rem] sm:p-3 sm:shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <div className="kyfi-record-tabs grid grid-cols-3 gap-1 rounded-[1.25rem] bg-slate-100/90 p-1 md:max-w-2xl md:gap-2 md:rounded-[1.5rem]">
              {tabs.map((item) => {
                const active = tab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setTab(item.key)}
                    className={[
                      "kyfi-record-tab rounded-[0.95rem] px-1.5 py-2 text-[0.64rem] font-extrabold leading-tight transition sm:rounded-[1.1rem] sm:px-4 sm:py-3 sm:text-sm sm:font-semibold",
                      active
                        ? "bg-white text-emerald-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-800",
                    ].join(" ")}
                  >
                    {t(item.labelKey)}
                  </button>
                );
              })}
            </div>

            <div className="p-2 pt-4 sm:p-6">
              {loading ? (
                <div className="flex items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 py-16 text-slate-500">
                  {t("myRecords.loading")}
                </div>
              ) : error ? (
                <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
                  {error}
                </div>
              ) : tab === "oldFarmers" ? (
                oldFarmers.length ? (
                  <div className="space-y-4">
                    {oldFarmers.map((record) => (
                      <motion.div
                        key={record.id}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                      >
                        <FarmerRecordCard record={record} t={t} />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 py-16 text-slate-500">
                    {t("myRecords.noOldFarmers")}
                  </div>
                )
              ) : tab === "newFarmers" ? (
                newFarmers.length ? (
                  <div className="space-y-4">
                    {newFarmers.map((record) => (
                      <motion.div
                        key={record.id}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                      >
                        <FarmerRecordCard record={record} t={t} />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 py-16 text-slate-500">
                    {t("myRecords.noNewFarmers")}
                  </div>
                )
              ) : tab === "votes" ? (
                oldFarmerVotes.length ? (
                  <div className="space-y-4">
                    {oldFarmerVotes.map((record) => (
                      <motion.div
                        key={record.id}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                      >
                        <VoteRecordCard record={record} t={t} />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 py-16 text-slate-500">
                    {t("myRecords.noVotes")}
                  </div>
                )
              ) : (
                <div className="flex items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 py-16 text-slate-500">
                  {t("myRecords.noVotes")}
                </div>
              )}
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </AuthGuard>
  );
}
