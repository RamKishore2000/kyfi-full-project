"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Fingerprint, Loader2, MapPin, Phone, Search, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KyfiToast } from "@/components/kyfi/kyfi-toast";
import { useKyfiLanguage } from "@/components/kyfi/language-provider";
import { fetchMandals, type MandalRecord } from "@/lib/api/locations";
import {
  searchFarmerStatuses,
} from "@/lib/api/farmer-status-search";
import { voteFarmerStatus, type FarmerStatusColor } from "@/lib/api/farmer-status";
import type { FarmerStatusRecord } from "@/lib/api/farmer-status";

type GooglePlace = {
  formatted_address?: string;
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  name?: string;
};

declare global {
  interface Window {
    google?: any;
  }
}

const voteOptions: Array<{
  value: FarmerStatusColor;
  label: string;
  tone: "green" | "yellow" | "red";
}> = [
  { value: "GREEN", label: "Green", tone: "green" },
  { value: "YELLOW", label: "Yellow", tone: "yellow" },
  { value: "RED", label: "Red", tone: "red" },
];

const getComponent = (components: GooglePlace["address_components"], names: string[]) => {
  if (!components) return "";

  for (const name of names) {
    const component = components.find((entry) => entry.types.includes(name));
    if (component?.long_name) {
      return component.long_name;
    }
  }

  return "";
};

const buildAutocompleteLabel = (place: GooglePlace) => place.formatted_address || place.name || "";

const formatMandalSuggestion = (mandal: MandalRecord) =>
  `${mandal.mandalName} mandal, ${mandal.districtName} district, ${mandal.stateName}`;

const loadGooglePlaces = (apiKey: string) =>
  new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    if (window.google?.maps?.places) {
      resolve();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-kyfi-google-places="true"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Google Maps failed to load")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.dataset.kyfiGooglePlaces = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(script);
  });

function maskAadhaar(value: string | null | undefined) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length >= 4 ? `XXXX XXXX ${digits.slice(-4)}` : "XXXX XXXX XXXX";
}

function formatDate(date: Date, language: "en" | "te") {
  return new Intl.DateTimeFormat(language === "te" ? "te-IN" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function VoteCheckbox({
  checked,
  disabled,
  tone,
  label,
  onClick,
}: {
  checked: boolean;
  disabled: boolean;
  tone: "green" | "yellow" | "red";
  label: string;
  onClick: () => void;
}) {
  const textTone =
    tone === "green"
      ? checked
        ? "text-emerald-900"
        : "text-emerald-800"
      : tone === "yellow"
        ? checked
          ? "text-yellow-900"
          : "text-yellow-800"
        : checked
          ? "text-red-900"
          : "text-red-800";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex w-fit items-center justify-start gap-4 rounded-full px-4 py-2 text-left transition",
        textTone,
        disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer",
      ].join(" ")}
    >
      <div className="min-w-0">
        <p className="font-manrope text-[0.98rem] font-medium leading-none">{label}</p>
      </div>

      <span
        className={[
          "ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2",
          checked ? "bg-current" : "bg-transparent",
          tone === "green"
            ? "border-emerald-500 text-emerald-500"
            : tone === "yellow"
              ? "border-yellow-500 text-yellow-500"
              : "border-red-500 text-red-500",
        ].join(" ")}
      >
        {checked ? (
          <svg
            viewBox="0 0 20 20"
            fill="none"
            className="h-3.5 w-3.5 text-white"
            aria-hidden="true"
          >
            <path
              d="M4 10.5L8 14.5L16 6"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>
    </button>
  );
}

function FarmerStatusCard({
  farmer,
  language,
  t,
  votingStatusId,
  onVote,
}: {
  farmer: FarmerStatusRecord;
  language: "en" | "te";
  t: ReturnType<typeof useKyfiLanguage>["t"];
  votingStatusId: number | null;
  onVote: (statusId: number, voteColor: FarmerStatusColor) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isVoting = votingStatusId === farmer.id;
  const articleClasses = farmer.blacklisted
    ? "overflow-hidden border border-rose-200/80 bg-[linear-gradient(180deg,rgba(255,241,242,0.98),rgba(255,228,230,0.95))] shadow-[0_14px_40px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(15,23,42,0.1)]"
    : "overflow-hidden border border-slate-200/70 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(15,23,42,0.1)]";

    return (
    <article className={articleClasses}>
      <div className={["px-5 py-5", farmer.blacklisted ? "bg-transparent" : "bg-white"].join(" ")}>
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 space-y-4 xl:flex-1">
              <div className="flex flex-wrap items-center gap-5">
                <p className="font-manrope text-[1.05rem] font-extrabold tracking-[-0.02em] text-slate-900">
                  {farmer.farmerName}
                </p>
                {farmer.blacklisted ? <Badge variant="destructive">{t("search.blacklisted")}</Badge> : null}
                <div className="flex flex-wrap items-center gap-4">
                  <Badge
                    variant="outline"
                  className="rounded-full border-emerald-200 bg-emerald-100 px-3 py-1.5 text-emerald-700"
                >
                  Green: {farmer.voteBreakdown?.GREEN ?? 0}
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-full border-yellow-200 bg-yellow-50 px-3 py-1.5 text-yellow-700"
                >
                  Yellow: {farmer.voteBreakdown?.YELLOW ?? 0}
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-full border-red-200 bg-red-100 px-3 py-1.5 text-red-700"
                >
                  Red: {farmer.voteBreakdown?.RED ?? 0}
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-12 gap-y-4 text-sm text-slate-600 xl:flex-nowrap">
              <MetaLine icon={MapPin} text={`${farmer.village}, ${farmer.mandal}`} />
              <MetaLine icon={Phone} text={farmer.mobileNumber || "-"} />
              <MetaLine icon={Fingerprint} text={maskAadhaar(farmer.aadhaar)} />
              <MetaLine label={t("search.votes")} text={String(farmer.voteCount)} compact />
              <VoteCheckbox
                checked={farmer.currentDealerVoteColor === "GREEN"}
                disabled={isVoting}
                tone="green"
                label="Green"
                onClick={() => void onVote(farmer.id, "GREEN")}
              />
              <VoteCheckbox
                checked={farmer.currentDealerVoteColor === "YELLOW"}
                disabled={isVoting}
                tone="yellow"
                label="Yellow"
                onClick={() => void onVote(farmer.id, "YELLOW")}
              />
              <VoteCheckbox
                checked={farmer.currentDealerVoteColor === "RED"}
                disabled={isVoting}
                tone="red"
                label="Red"
                onClick={() => void onVote(farmer.id, "RED")}
              />
              <button
              type="button"
              onClick={() => setExpanded((current) => !current)}
              className="inline-flex items-center justify-center self-end rounded-full border border-slate-200 bg-white p-2 text-sm font-semibold text-slate-700 transition hover:border-[rgb(4,120,87)] hover:text-[rgb(4,120,87)]"
              aria-expanded={expanded}
              aria-label={expanded ? "Hide details" : "Show details"}
            >
              <ChevronDown className={["h-4 w-4 shrink-0 transition", expanded ? "rotate-180" : ""].join(" ")} />
            </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 xl:w-[520px] xl:items-end">
            <div className="flex w-full flex-wrap items-center justify-end gap-6">
            </div>

          </div>
        </div>

      </div>

      {expanded ? (
        <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <MiniInfo label={t("search.district")} value={farmer.district} />
            <MiniInfo label={t("search.location")} value={`${farmer.village}, ${farmer.mandal}`} />
            <MiniInfo label={t("search.dateAdded")} value={formatDate(new Date(farmer.createdAt), language)} />
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <MiniInfo label={t("search.remarks")} value={farmer.remarks || "-"} />
            <MiniInfo label={t("search.maskedAadhaar")} value={maskAadhaar(farmer.aadhaar)} />
          </div>

          {farmer.blacklisted ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-900">
                {t("search.blacklisted")}
              </p>
              <p className="mt-2 text-sm leading-7 text-rose-800">
                {farmer.blacklistReason || t("search.blacklistWarningAttached")}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export function SearchFarmerPreview() {
  const { language, t } = useKyfiLanguage();
  const villageInputRef = useRef<HTMLInputElement | null>(null);
  const villageAutocompleteRef = useRef<any>(null);
  const mandalInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState({
    mandal: "",
    village: "",
    farmerName: "",
  });
  const [mandalOptions, setMandalOptions] = useState<MandalRecord[]>([]);
  const [mandalSearchLoading, setMandalSearchLoading] = useState(false);
  const [hideMandalSuggestions, setHideMandalSuggestions] = useState(false);
  const [results, setResults] = useState<FarmerStatusRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [votingStatusId, setVotingStatusId] = useState<number | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastTone, setToastTone] = useState<"success" | "error">("success");

  useEffect(() => {
    const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
    if (!googleApiKey) {
      return;
    }

    let isCancelled = false;

    loadGooglePlaces(googleApiKey)
      .then(() => {
        if (isCancelled || !window.google?.maps?.places) {
          return;
        }

        if (villageInputRef.current) {
          villageAutocompleteRef.current = new window.google.maps.places.Autocomplete(villageInputRef.current, {
            fields: ["formatted_address", "address_components", "name"],
            types: ["geocode"],
            componentRestrictions: { country: "in" },
          });

          villageAutocompleteRef.current.addListener("place_changed", () => {
            const place = villageAutocompleteRef.current.getPlace() as GooglePlace | undefined;
            if (!place) return;

            const value =
              getComponent(place.address_components, [
                "locality",
                "sublocality_level_1",
                "sublocality",
                "neighborhood",
                "administrative_area_level_3",
              ]) || place.name || buildAutocompleteLabel(place);

            setForm((current) => ({ ...current, village: value }));
          });
        }
      })
      .catch(() => {
        // Keep manual entry available if Places fails to load.
      });

    return () => {
      isCancelled = true;
      if (villageAutocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(villageAutocompleteRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const mandalQuery = form.mandal.trim();

    if (hideMandalSuggestions || mandalQuery.length < 2) {
      setMandalOptions([]);
      setMandalSearchLoading(false);
      return;
    }

    let isCancelled = false;
    setMandalSearchLoading(true);

    const debounce = window.setTimeout(() => {
      fetchMandals({
        query: mandalQuery || undefined,
      })
        .then((response) => {
          if (!isCancelled) {
            setMandalOptions(response.mandals);
            setMandalSearchLoading(false);
          }
        })
        .catch(() => {
          if (!isCancelled) {
            setMandalOptions([]);
            setMandalSearchLoading(false);
          }
        });
    }, 200);

    return () => {
      isCancelled = true;
      window.clearTimeout(debounce);
    };
  }, [form.mandal, hideMandalSuggestions]);

  const summaryCount = useMemo(() => results.length, [results.length]);

  const runSearch = async () => {
    const mandal = form.mandal.trim();
    const village = form.village.trim();
    const farmer_name = form.farmerName.trim();

    if (!mandal && !village && !farmer_name) {
      setResults([]);
      setToastMessage(t("search.fillAtLeastOne"));
      setToastTone("error");
      setToastOpen(true);
      return;
    }

    setLoading(true);

    try {
      const response = await searchFarmerStatuses({
        mandal,
        village,
        farmer_name,
      });

      setResults(response.results);
      if (!response.results.length) {
        setToastMessage(t("search.noRecordFound"));
        setToastTone("error");
        setToastOpen(true);
      }
    } catch (error) {
      setResults([]);
      setToastMessage(error instanceof Error ? error.message : t("search.unable"));
      setToastTone("error");
      setToastOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (statusId: number, voteColor: FarmerStatusColor) => {
    setVotingStatusId(statusId);

    try {
      const response = await voteFarmerStatus(statusId, voteColor);
      if (response.farmerStatus) {
        setResults((current) =>
          current.map((farmer) => (farmer.id === statusId ? response.farmerStatus! : farmer)),
        );
      }
      setToastMessage(response.message);
      setToastTone("success");
      setToastOpen(true);
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : t("search.unable"));
      setToastTone("error");
      setToastOpen(true);
    } finally {
      setVotingStatusId(null);
    }
  };

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
            <LegendItem tone="success" label="GREEN" text={t("search.legendGreen")} helper={t("search.legendGreen")} />
            <LegendItem tone="warning" label="YELLOW" text={t("search.legendYellow")} helper={t("search.legendYellow")} />
            <LegendItem tone="destructive" label="RED" text={t("search.legendRed")} helper={t("search.legendRed")} />
            <LegendItem tone="destructive" label="BLACKLIST" text={t("search.legendBlack")} helper={t("search.legendBlack")} />
          </div>

          <div className="grid gap-4 border-b border-slate-200/80 pb-5 xl:grid-cols-[1fr_1fr_1fr_auto] xl:items-end">
            <div className="relative space-y-2">
              <label className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-slate-500">
                {t("search.mandalLabel")}
              </label>
              <Input
                ref={mandalInputRef}
                className="h-12 rounded-full border border-slate-200 bg-white shadow-none focus:border-[rgb(4,120,87)]"
                placeholder={t("search.mandalPlaceholder")}
                value={form.mandal}
                onChange={(event) => {
                  setHideMandalSuggestions(false);
                  setForm((current) => ({ ...current, mandal: event.target.value }));
                }}
              />
              {form.mandal.trim().length >= 2 && !hideMandalSuggestions ? (
                <div className="absolute left-0 top-full z-20 mt-2 max-h-56 w-full overflow-auto rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                  {mandalSearchLoading ? (
                    <div className="px-4 py-3 font-manrope text-sm text-slate-500">
                      {t("search.searchingMandals")}
                    </div>
                  ) : mandalOptions.length ? (
                    mandalOptions.map((mandal) => (
                      <button
                        key={mandal.id}
                        type="button"
                        onClick={() => {
                          setForm((current) => ({
                            ...current,
                            mandal: mandal.mandalName,
                          }));
                          setHideMandalSuggestions(true);
                          setMandalOptions([]);
                        }}
                        className="flex w-full flex-col items-start gap-1 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-emerald-50"
                      >
                        <span className="font-manrope text-sm font-semibold text-slate-900">
                          {formatMandalSuggestion(mandal)}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 font-manrope text-sm text-slate-500">
                      {t("search.noMandal")}
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-slate-500">
                {t("search.villageLabel")}
              </label>
              <Input
                ref={villageInputRef}
                className="h-12 rounded-full border border-slate-200 bg-white shadow-none focus:border-[rgb(4,120,87)]"
                placeholder={t("search.villagePlaceholder")}
                value={form.village}
                onChange={(event) => setForm((current) => ({ ...current, village: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-slate-500">
                {t("search.farmerNameLabel")}
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  className="h-12 rounded-full border border-slate-200 bg-white pl-10 shadow-none focus:border-[rgb(4,120,87)]"
                  placeholder={t("search.farmerNamePlaceholder")}
                  value={form.farmerName}
                  onChange={(event) => setForm((current) => ({ ...current, farmerName: event.target.value }))}
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
              className="h-12 w-full rounded-full !bg-[rgb(4,120,87)] px-6 font-semibold !text-white shadow-[0_12px_24px_rgba(4,120,87,0.18)] hover:!bg-[rgb(4,120,87)] hover:brightness-110 xl:w-[220px]"
              onClick={runSearch}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? t("search.loading") : t("search.searchButton")}
            </Button>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-[0.72rem] font-black uppercase tracking-[0.22em] text-slate-500">
              {t("search.results")}
            </p>
            <Badge variant="outline" className="border-slate-200">
              {summaryCount} {t("search.found")}
            </Badge>
          </div>

          <div className="space-y-4">
            {results.map((farmer) => (
              <FarmerStatusCard
                key={farmer.id}
                farmer={farmer}
                language={language}
                t={t}
                votingStatusId={votingStatusId}
                onVote={handleVote}
              />
            ))}

            {!results.length ? (
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

      <KyfiToast
        open={toastOpen}
        message={toastMessage}
        tone={toastTone}
        onClose={() => setToastOpen(false)}
      />
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
    <div className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap">
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
