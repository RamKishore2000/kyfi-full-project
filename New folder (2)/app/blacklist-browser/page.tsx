"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { BlacklistWarning } from "@/components/kyfi/blacklist-warning";
import { AuthGuard } from "@/components/kyfi/auth-guard";
import { Footer } from "@/components/kyfi/footer";
import { Header } from "@/components/kyfi/header";
import { KyfiToast } from "@/components/kyfi/kyfi-toast";
import { useKyfiLanguage } from "@/components/kyfi/language-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchMandals, type MandalRecord } from "@/lib/api/locations";
import {
  addBlacklistEntry,
  checkBlacklistEntry,
  removeBlacklistEntry,
  reportBlacklistEntry,
  searchBlacklistEntries,
  type BlacklistEntryRecord,
} from "@/lib/api/blacklist";

type AddBlacklistForm = {
  farmerName: string;
  mobileNumber: string;
  mandal: string;
  village: string;
  reason: string;
  address: string;
};

const initialAddBlacklistForm: AddBlacklistForm = {
  farmerName: "",
  mobileNumber: "",
  mandal: "",
  village: "",
  reason: "",
  address: "",
};

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

const formatBlacklistDealerCount = (count: number) =>
  count === 1 ? "Blacklisted by 1 dealer" : `Blacklisted by ${count} dealers`;

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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="font-manrope type-small text-slate-500">{label}</p>
      <p className="mt-1 font-manrope type-nav text-slate-900">{value}</p>
    </div>
  );
}

function maskNumber(value?: string | null) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length >= 4 ? `XXXX XXXX ${digits.slice(-4)}` : "XXXX XXXX XXXX";
}

export default function BlacklistBrowserPage() {
  const { language, t } = useKyfiLanguage();
  const isTe = language === "te";

  const mandalInputRef = useRef<HTMLInputElement | null>(null);
  const villageInputRef = useRef<HTMLInputElement | null>(null);
  const villageAutocompleteRef = useRef<any>(null);
  const addFarmerNameInputRef = useRef<HTMLInputElement | null>(null);
  const addMobileInputRef = useRef<HTMLInputElement | null>(null);
  const addMandalInputRef = useRef<HTMLInputElement | null>(null);
  const addVillageInputRef = useRef<HTMLInputElement | null>(null);
  const addReasonInputRef = useRef<HTMLTextAreaElement | null>(null);
  const addVillageAutocompleteRef = useRef<any>(null);

  const [searchForm, setSearchForm] = useState({ mandal: "", village: "" });
  const [addForm, setAddForm] = useState<AddBlacklistForm>(initialAddBlacklistForm);
  const [searchMandalOptions, setSearchMandalOptions] = useState<MandalRecord[]>([]);
  const [addMandalOptions, setAddMandalOptions] = useState<MandalRecord[]>([]);
  const [searchMandalLoading, setSearchMandalLoading] = useState(false);
  const [addMandalLoading, setAddMandalLoading] = useState(false);
  const [hideSearchMandalSuggestions, setHideSearchMandalSuggestions] = useState(false);
  const [hideAddMandalSuggestions, setHideAddMandalSuggestions] = useState(false);
  const [entries, setEntries] = useState<BlacklistEntryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [existingEntryModalOpen, setExistingEntryModalOpen] = useState(false);
  const [existingEntry, setExistingEntry] = useState<BlacklistEntryRecord | null>(null);
  const [addingBlacklist, setAddingBlacklist] = useState(false);
  const [reportingBlacklist, setReportingBlacklist] = useState(false);
  const [entryActionState, setEntryActionState] = useState<{
    id: number | null;
    action: "add" | "remove" | null;
  }>({
    id: null,
    action: null,
  });
  const [addError, setAddError] = useState("");
  const [addFieldErrors, setAddFieldErrors] = useState({
    farmerName: "",
    mobileNumber: "",
    mandal: "",
    village: "",
    reason: "",
  });
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    tone: "success" | "error";
  }>({
    open: false,
    message: "",
    tone: "success",
  });

  const showToast = (nextMessage: string, tone: "success" | "error" = "success") => {
    setToast({ open: true, message: nextMessage, tone });
  };

  const syncEntry = (updatedEntry: BlacklistEntryRecord | null) => {
    if (!updatedEntry) return;

    setEntries((current) =>
      current.map((entry) => (entry.id === updatedEntry.id ? updatedEntry : entry)),
    );
    setExistingEntry((current) => (current && current.id === updatedEntry.id ? updatedEntry : current));
  };

  const resetAddForm = () => {
    setAddForm(initialAddBlacklistForm);
    setAddError("");
    setAddFieldErrors({
      farmerName: "",
      mobileNumber: "",
      mandal: "",
      village: "",
      reason: "",
    });
    setHideAddMandalSuggestions(false);
    setAddMandalOptions([]);
  };

  useEffect(() => {
    if (!toast.open) return;

    const timeout = window.setTimeout(() => {
      setToast((current) => ({ ...current, open: false }));
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [toast.open]);

  useEffect(() => {
    const isAnyModalOpen = addModalOpen || existingEntryModalOpen;
    if (!isAnyModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [addModalOpen, existingEntryModalOpen]);

  useEffect(() => {
    const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
    if (!googleApiKey) return;

    let isCancelled = false;

    loadGooglePlaces(googleApiKey)
      .then(() => {
        if (isCancelled || !window.google?.maps?.places) return;

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

            setSearchForm((current) => ({ ...current, village: value }));
          });
        }
      })
      .catch(() => {
        // Manual entry stays available.
      });

    return () => {
      isCancelled = true;
      if (villageAutocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(villageAutocompleteRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
    if (!googleApiKey || !addModalOpen) return;

    let isCancelled = false;

    loadGooglePlaces(googleApiKey)
      .then(() => {
        if (isCancelled || !window.google?.maps?.places) return;

        if (addVillageInputRef.current) {
          addVillageAutocompleteRef.current = new window.google.maps.places.Autocomplete(addVillageInputRef.current, {
            fields: ["formatted_address", "address_components", "name"],
            types: ["geocode"],
            componentRestrictions: { country: "in" },
          });

          addVillageAutocompleteRef.current.addListener("place_changed", () => {
            const place = addVillageAutocompleteRef.current.getPlace() as GooglePlace | undefined;
            if (!place) return;

            const value =
              getComponent(place.address_components, [
                "locality",
                "sublocality_level_1",
                "sublocality",
                "neighborhood",
                "administrative_area_level_3",
              ]) || place.name || buildAutocompleteLabel(place);

            setAddForm((current) => ({ ...current, village: value }));
          });
        }
      })
      .catch(() => {
        // Manual entry stays available.
      });

    return () => {
      isCancelled = true;
      if (addVillageAutocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(addVillageAutocompleteRef.current);
      }
    };
  }, [addModalOpen]);

  useEffect(() => {
    const mandalQuery = searchForm.mandal.trim();
    if (hideSearchMandalSuggestions || mandalQuery.length < 2) {
      setSearchMandalOptions([]);
      setSearchMandalLoading(false);
      return;
    }

    let isCancelled = false;
    setSearchMandalLoading(true);
    const debounce = window.setTimeout(() => {
      fetchMandals({ query: mandalQuery || undefined })
        .then((response) => {
          if (!isCancelled) {
            setSearchMandalOptions(response.mandals);
            setSearchMandalLoading(false);
          }
        })
        .catch(() => {
          if (!isCancelled) {
            setSearchMandalOptions([]);
            setSearchMandalLoading(false);
          }
        });
    }, 200);

    return () => {
      isCancelled = true;
      window.clearTimeout(debounce);
    };
  }, [searchForm.mandal, hideSearchMandalSuggestions]);

  useEffect(() => {
    const mandalQuery = addForm.mandal.trim();
    if (hideAddMandalSuggestions || mandalQuery.length < 2) {
      setAddMandalOptions([]);
      setAddMandalLoading(false);
      return;
    }

    let isCancelled = false;
    setAddMandalLoading(true);
    const debounce = window.setTimeout(() => {
      fetchMandals({ query: mandalQuery || undefined })
        .then((response) => {
          if (!isCancelled) {
            setAddMandalOptions(response.mandals);
            setAddMandalLoading(false);
          }
        })
        .catch(() => {
          if (!isCancelled) {
            setAddMandalOptions([]);
            setAddMandalLoading(false);
          }
        });
    }, 200);

    return () => {
      isCancelled = true;
      window.clearTimeout(debounce);
    };
  }, [addForm.mandal, hideAddMandalSuggestions]);

  const runSearch = async () => {
    const mandal = searchForm.mandal.trim();
    const village = searchForm.village.trim();

    if (!mandal && !village) {
      showToast(isTe ? "మండలం లేదా గ్రామం నమోదు చేయండి." : "Fill mandal or village.", "error");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await searchBlacklistEntries({
        mandal,
        village,
      });

      setEntries(response.entries);
      setSearched(true);
      setMessage(response.entries.length ? null : t("blacklist.noRecordFound"));
    } catch (error) {
      setEntries([]);
      setSearched(true);
      setMessage(error instanceof Error ? error.message : t("blacklist.unable"));
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    resetAddForm();
    setAddModalOpen(true);
  };

  const closeAddModal = () => {
    setAddModalOpen(false);
    setAddError("");
  };

  const handleAddChange = (key: keyof AddBlacklistForm, value: string) => {
    if (key === "mobileNumber") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setAddForm((current) => ({ ...current, mobileNumber: digits }));
      setAddFieldErrors((current) => ({ ...current, mobileNumber: "" }));
      setAddError("");
      return;
    }

    setAddForm((current) => {
      if (key === "mandal") {
        return { ...current, mandal: value };
      }

      return { ...current, [key]: value };
    });

    if (key === "mandal") {
      setHideAddMandalSuggestions(false);
    }

    if (key !== "address") {
      setAddFieldErrors((current) => ({ ...current, [key]: "" }));
    }
    setAddError("");
  };

  const handleReportBlacklist = async () => {
    if (!existingEntry || existingEntry.currentDealerReported) return;

    setReportingBlacklist(true);

    try {
      const response = await reportBlacklistEntry(existingEntry.id);
      setExistingEntry(response.blacklistEntry);
      showToast(isTe ? "Blacklist count పెరిగింది." : "Blacklist count increased.");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : isTe ? "Blacklist report విఫలమైంది." : "Unable to report blacklist entry.",
        "error",
      );
    } finally {
      setReportingBlacklist(false);
    }
  };

  const handleEntryAdd = async (entry: BlacklistEntryRecord) => {
    setEntryActionState({ id: entry.id, action: "add" });

    try {
      const response = await reportBlacklistEntry(entry.id);
      syncEntry(response.blacklistEntry);
      showToast(isTe ? "Blacklist count పెరిగింది." : "Blacklist count increased.");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : isTe ? "Blacklist add failed." : "Unable to add blacklist report.",
        "error",
      );
    } finally {
      setEntryActionState({ id: null, action: null });
    }
  };

  const handleEntryRemove = async (entry: BlacklistEntryRecord) => {
    setEntryActionState({ id: entry.id, action: "remove" });

    try {
      const response = await removeBlacklistEntry(entry.id);
      if (response.deleted) {
        setEntries((current) => current.filter((currentEntry) => currentEntry.id !== entry.id));
        setExistingEntry((current) => (current && current.id === entry.id ? null : current));
        setExistingEntryModalOpen(false);
        showToast(isTe ? "Blacklist entry తొలగించబడింది." : "Blacklist entry removed.");
      } else {
        syncEntry(response.blacklistEntry);
        showToast(isTe ? "Blacklist count తగ్గింది." : "Blacklist count decreased.");
      }
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : isTe ? "Blacklist remove failed." : "Unable to remove blacklist report.",
        "error",
      );
    } finally {
      setEntryActionState({ id: null, action: null });
    }
  };

  const handleAddSubmit = async () => {
    setAddError("");
    setAddFieldErrors({
      farmerName: "",
      mobileNumber: "",
      mandal: "",
      village: "",
      reason: "",
    });

    const nextErrors = {
      farmerName: addForm.farmerName.trim()
        ? ""
        : isTe
          ? "రైతు పేరు అవసరం."
          : "Farmer name is required.",
      mobileNumber: /^[6-9]\d{9}$/.test(addForm.mobileNumber)
        ? ""
        : isTe
          ? "10 అంకెల mobile number నమోదు చేయండి."
          : "Enter a valid 10-digit mobile number.",
      mandal: addForm.mandal.trim() ? "" : isTe ? "మండలం అవసరం." : "Mandal is required.",
      village: addForm.village.trim() ? "" : isTe ? "గ్రామం అవసరం." : "Village is required.",
      reason: addForm.reason.trim() ? "" : isTe ? "కారణం అవసరం." : "Reason is required.",
    };

    setAddFieldErrors(nextErrors);

    const firstInvalidField = Object.entries(nextErrors).find(([, value]) => Boolean(value))?.[0];
    if (firstInvalidField) {
      if (firstInvalidField === "farmerName") addFarmerNameInputRef.current?.focus();
      if (firstInvalidField === "mobileNumber") addMobileInputRef.current?.focus();
      if (firstInvalidField === "mandal") addMandalInputRef.current?.focus();
      if (firstInvalidField === "village") addVillageInputRef.current?.focus();
      if (firstInvalidField === "reason") addReasonInputRef.current?.focus();
      return;
    }

    setAddingBlacklist(true);

    try {
      const checkResponse = await checkBlacklistEntry({
        mobileNumber: addForm.mobileNumber.trim(),
      });

      if (checkResponse.exists && checkResponse.blacklistEntry) {
        setExistingEntry(checkResponse.blacklistEntry);
        closeAddModal();
        setExistingEntryModalOpen(true);
        showToast(
          checkResponse.blacklistEntry.currentDealerReported
            ? isTe
              ? "మీరు ఇప్పటికే ఈ farmer‌ను blacklist‌కు జోడించారు."
              : "You have already added this farmer to the blacklist."
            : isTe
              ? "ఇప్పటికే blacklist ఎంట్రీ ఉంది."
              : "This farmer has already been added to the blacklist by another dealer.",
          "error",
        );
        return;
      }

      const response = await addBlacklistEntry({
        mobileNumber: addForm.mobileNumber.trim(),
        farmerName: addForm.farmerName.trim(),
        mandal: addForm.mandal.trim(),
        village: addForm.village.trim(),
        reason: addForm.reason.trim(),
        address: addForm.address.trim() || undefined,
      });

      setMessage(null);
      showToast(isTe ? "Blacklist ఎంట్రీ విజయవంతంగా జోడించబడింది" : "Blacklist entry added successfully");
      closeAddModal();
      resetAddForm();
    } catch (error) {
      const nextMessage =
        error instanceof Error
          ? error.message
          : isTe
            ? "Blacklist ఎంట్రీని సేవ్ చేయలేకపోయాము"
            : "Unable to save blacklist entry";
      setAddError(nextMessage);
      showToast(nextMessage, "error");
    } finally {
      setAddingBlacklist(false);
    }
  };

  const closeExistingModal = () => {
    setExistingEntryModalOpen(false);
    setExistingEntry(null);
  };

  return (
    <AuthGuard>
      <main className="kyfi-shell min-h-screen">
        <Header />

      <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full">
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <h1 className="mt-3 font-manrope type-section text-slate-900">{t("blacklist.review")}</h1>
              <p className="mt-4 max-w-2xl font-manrope type-body text-slate-600">
                Review confirmed non-payment records by mandal and village, or open the add flow to create a new blacklist entry.
              </p>
            </div>

            <Button
              type="button"
              className="rounded-full !bg-[rgb(4,120,87)] !text-white hover:!bg-[rgb(4,120,87)] hover:brightness-105"
              onClick={openAddModal}
            >
              {t("blacklist.addToBlacklist")}
            </Button>
          </div>

          <BlacklistWarning />

          <div className="relative z-30 mt-5 space-y-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
              <div className="relative space-y-2">
                <label className="font-manrope type-nav text-slate-800">{t("blacklist.mandalLabel")}</label>
                <Input
                  ref={mandalInputRef}
                  placeholder={t("blacklist.placeholderMandal")}
                  value={searchForm.mandal}
                  onChange={(event) => {
                    setHideSearchMandalSuggestions(false);
                    setSearchForm((current) => ({ ...current, mandal: event.target.value }));
                  }}
                />
                {searchForm.mandal.trim().length >= 2 && !hideSearchMandalSuggestions ? (
                  <div className="absolute left-0 top-full z-20 mt-2 max-h-56 w-full overflow-auto rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                    {searchMandalLoading ? (
                      <div className="px-4 py-3 font-manrope text-sm text-slate-500">
                        {t("blacklist.searching")}
                      </div>
                    ) : searchMandalOptions.length ? (
                      searchMandalOptions.map((mandal) => (
                        <button
                          key={mandal.id}
                          type="button"
                          onClick={() => {
                            setSearchForm((current) => ({
                              ...current,
                              mandal: mandal.mandalName,
                            }));
                            setHideSearchMandalSuggestions(true);
                            setSearchMandalOptions([]);
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
                        {t("blacklist.noMandal")}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="font-manrope type-nav text-slate-800">{t("blacklist.villageLabel")}</label>
                <Input
                  ref={villageInputRef}
                  placeholder={t("blacklist.placeholderVillage")}
                  value={searchForm.village}
                  onChange={(event) =>
                    setSearchForm((current) => ({ ...current, village: event.target.value }))
                  }
                />
              </div>

              <div className="flex justify-end">
                <Button
                  className="w-full !bg-[rgb(4,120,87)] !text-white hover:!bg-[rgb(4,120,87)] hover:brightness-105 sm:w-auto"
                  size="lg"
                  onClick={runSearch}
                  disabled={loading}
                >
                  {loading ? t("common.loading") : t("blacklist.searchButton")}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="mt-2 font-manrope type-card text-slate-900">{t("blacklist.records")}</h2>
              <Badge variant="destructive">
                {entries.length} {t("blacklist.found")}
              </Badge>
            </div>

            {message ? (
              <div
                className={[
                  "rounded-2xl p-4",
                  message === t("blacklist.noRecordFound")
                    ? "border border-slate-200 bg-slate-50"
                    : "border border-red-200 bg-red-50",
                ].join(" ")}
              >
                <p
                  className={[
                    "font-manrope type-body",
                    message === t("blacklist.noRecordFound") ? "text-slate-700" : "text-red-700",
                  ].join(" ")}
                >
                  {message}
                </p>
              </div>
            ) : null}

            {!searched ? (
              <div className="px-1 py-10 text-center">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                  {t("blacklist.searchResults")}
                </p>
              </div>
            ) : null}

            {searched && entries.length ? (
              <div className="divide-y divide-red-100 overflow-hidden border border-red-100">
                {entries.map((entry) => (
                  <div key={entry.id} className="bg-red-50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="font-manrope type-card capitalize text-slate-900">
                            {entry.farmerName}
                          </p>
                          <Badge variant="destructive">
                            {formatBlacklistDealerCount(entry.reportCount ?? 0).toUpperCase()}
                          </Badge>
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <div>
                            <p className="font-manrope type-small uppercase tracking-[0.16em] text-slate-500">
                              {t("blacklist.villageLabel")}
                            </p>
                            <p className="mt-1 font-manrope type-body leading-6 text-slate-700">
                              {entry.village}
                            </p>
                          </div>
                          <div>
                            <p className="font-manrope type-small uppercase tracking-[0.16em] text-slate-500">
                              {t("blacklist.mandalLabel")}
                            </p>
                            <p className="mt-1 font-manrope type-body leading-6 text-slate-700">
                              {entry.mandal}
                            </p>
                          </div>
                          <div>
                            <p className="font-manrope type-small uppercase tracking-[0.16em] text-slate-500">
                              {isTe ? "Aadhaar" : "Aadhaar"}
                            </p>
                            <p className="mt-1 font-manrope type-body leading-6 text-slate-700">
                              {entry.aadhaarMasked || maskNumber(entry.aadhaar)}
                            </p>
                          </div>
                          <div>
                            <p className="font-manrope type-small uppercase tracking-[0.16em] text-slate-500">
                              {isTe ? "Mobile" : "Mobile"}
                            </p>
                            <p className="mt-1 font-manrope type-body leading-6 text-slate-700">
                              {entry.mobileNumber || "-"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-start">
                        {entry.currentDealerReported ? (
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-full border-red-200 bg-white text-red-700 hover:bg-red-50 hover:text-red-800"
                            onClick={() => void handleEntryRemove(entry)}
                            disabled={entryActionState.id === entry.id && entryActionState.action === "remove"}
                          >
                            {entryActionState.id === entry.id && entryActionState.action === "remove"
                              ? (isTe ? "Removing..." : "Removing...")
                              : (isTe ? "Remove" : "Remove")}
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            className="rounded-full !bg-[rgb(4,120,87)] !text-white hover:!bg-[rgb(4,120,87)] hover:brightness-105"
                            onClick={() => void handleEntryAdd(entry)}
                            disabled={entryActionState.id === entry.id && entryActionState.action === "add"}
                          >
                            {entryActionState.id === entry.id && entryActionState.action === "add"
                              ? (isTe ? "Adding..." : "Adding...")
                              : (isTe ? "Add to Blacklist" : "Add to Blacklist")}
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 border-t border-red-100 pt-4">
                      <p className="font-manrope type-body leading-6 text-slate-700">
                        {t("blacklist.reasonLabel")}: {entry.reason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <KyfiToast
        open={toast.open}
        message={toast.message}
        tone={toast.tone}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
      />

      {addModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-4xl max-h-[calc(100vh-3rem)] overflow-y-auto rounded-[2rem] border border-white/80 bg-white p-5 shadow-[0_28px_100px_rgba(15,23,42,0.22)] sm:p-6"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-2">
                <div className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[0.72rem] font-extrabold uppercase tracking-[0.2em] text-red-700">
                  {isTe ? "Blacklistలోకి జోడించండి" : "Add to blacklist"}
                </div>
                <h2 className="font-manrope text-[1.55rem] font-extrabold tracking-[-0.04em] text-slate-900 sm:text-[1.8rem]">
                  {isTe ? "కొత్త blacklist ఎంట్రీ" : "Create a new blacklist entry"}
                </h2>
                <p className="max-w-2xl font-manrope type-body text-slate-600">
                  {isTe
                    ? "ఇక్కడ mobile number ఆధారంగా blacklist ఎంట్రీ జోడించండి. ఇప్పటికే ఉంటే వేరే modal తెరుచుకుంటుంది."
                    : "Create a blacklist entry using a mobile number. If it already exists, a separate modal opens."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeAddModal}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label={isTe ? "మోడల్ మూసివేయండి" : "Close modal"}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {addError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {addError}
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="font-manrope type-nav text-slate-800">
                    {isTe ? "రైతు పేరు" : "Farmer name"} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    ref={addFarmerNameInputRef}
                    placeholder={isTe ? "రైతు పేరును నమోదు చేయండి" : "Enter farmer name"}
                    value={addForm.farmerName}
                    onChange={(event) => handleAddChange("farmerName", event.target.value)}
                    aria-invalid={Boolean(addFieldErrors.farmerName)}
                    className={addFieldErrors.farmerName ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-100" : ""}
                  />
                  {addFieldErrors.farmerName ? (
                    <p className="font-manrope text-sm text-red-600">{addFieldErrors.farmerName}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label className="font-manrope type-nav text-slate-800">
                    {isTe ? "Mobile number" : "Mobile number"} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    ref={addMobileInputRef}
                    placeholder={isTe ? "10 అంకెల mobile number నమోదు చేయండి" : "Enter 10-digit mobile number"}
                    value={addForm.mobileNumber}
                    onChange={(event) => handleAddChange("mobileNumber", event.target.value)}
                    inputMode="numeric"
                    maxLength={10}
                    aria-invalid={Boolean(addFieldErrors.mobileNumber)}
                    className={addFieldErrors.mobileNumber ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-100" : ""}
                  />
                  {addFieldErrors.mobileNumber ? (
                    <p className="font-manrope text-sm text-red-600">{addFieldErrors.mobileNumber}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label className="font-manrope type-nav text-slate-800">
                    {isTe ? "మండలం" : "Mandal"} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative space-y-2">
                    <Input
                      ref={addMandalInputRef}
                      placeholder={isTe ? "2 లేదా అంతకంటే ఎక్కువ అక్షరాలు టైప్ చేయండి" : "Type 2 or more letters"}
                      value={addForm.mandal}
                      onChange={(event) => handleAddChange("mandal", event.target.value)}
                      aria-invalid={Boolean(addFieldErrors.mandal)}
                      className={addFieldErrors.mandal ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-100" : ""}
                    />
                    {addForm.mandal.trim().length >= 2 && !hideAddMandalSuggestions ? (
                      <div className="max-h-56 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                        {addMandalLoading ? (
                          <div className="px-4 py-3 font-manrope text-sm text-slate-500">
                            {isTe ? "మండలాలను వెతుకుతోంది..." : "Searching mandals..."}
                          </div>
                        ) : addMandalOptions.length ? (
                          addMandalOptions.map((mandal) => (
                            <button
                              key={mandal.id}
                              type="button"
                              onClick={() => {
                                setAddForm((current) => ({
                                  ...current,
                                  mandal: mandal.mandalName,
                                }));
                                setHideAddMandalSuggestions(true);
                                setAddMandalOptions([]);
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
                            {isTe ? "సరిపోలే మండలం కనబడలేదు." : "No matching mandal found."}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                  {addFieldErrors.mandal ? (
                    <p className="font-manrope text-sm text-red-600">{addFieldErrors.mandal}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label className="font-manrope type-nav text-slate-800">
                    {isTe ? "గ్రామం" : "Village"} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    ref={addVillageInputRef}
                    placeholder={isTe ? "గ్రామాన్ని నమోదు చేయండి" : "Enter village"}
                    value={addForm.village}
                    onChange={(event) => handleAddChange("village", event.target.value)}
                    aria-invalid={Boolean(addFieldErrors.village)}
                    className={addFieldErrors.village ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-100" : ""}
                  />
                  {addFieldErrors.village ? (
                    <p className="font-manrope text-sm text-red-600">{addFieldErrors.village}</p>
                  ) : null}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="font-manrope type-nav text-slate-800">
                    {isTe ? "కారణం" : "Reason"} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    ref={addReasonInputRef}
                    value={addForm.reason}
                    onChange={(event) => handleAddChange("reason", event.target.value)}
                    placeholder={isTe ? "నిర్ధారిత బాకీకి కారణాన్ని వివరించండి" : "Explain the confirmed unpaid dues reason"}
                    aria-invalid={Boolean(addFieldErrors.reason)}
                    className={[
                      "min-h-[120px] w-full rounded-xl border border-input bg-background px-4 py-3 font-manrope type-body text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      addFieldErrors.reason ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-100" : "",
                    ].join(" ")}
                  />
                  {addFieldErrors.reason ? (
                    <p className="font-manrope text-sm text-red-600">{addFieldErrors.reason}</p>
                  ) : null}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="font-manrope type-nav text-slate-800">
                    {isTe ? (
                      <>
                        చిరునామా <span className="text-slate-400">(ఐచ్ఛికం)</span>
                      </>
                    ) : (
                      <>
                        Address <span className="text-slate-400">(optional)</span>
                      </>
                    )}
                  </label>
                  <Input
                    placeholder={isTe ? "సందర్భానికి ఐచ్ఛిక చిరునామా" : "Optional address for reference"}
                    value={addForm.address}
                    onChange={(event) => handleAddChange("address", event.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  className="w-full !bg-[rgb(4,120,87)] !text-white hover:!bg-[rgb(4,120,87)] hover:brightness-105 sm:w-auto sm:min-w-[280px] lg:min-w-[320px]"
                  size="lg"
                  onClick={() => void handleAddSubmit()}
                  disabled={addingBlacklist}
                >
                  {addingBlacklist ? (isTe ? "సేవ్ చేస్తోంది..." : "Saving...") : isTe ? "Blacklist ఎంట్రీ జోడించండి" : "Add blacklist entry"}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}

      {existingEntryModalOpen && existingEntry ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 py-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-2xl max-h-[calc(100vh-3rem)] overflow-y-auto rounded-[2rem] border border-white/80 bg-white p-5 shadow-[0_28px_100px_rgba(15,23,42,0.22)] sm:p-6"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-2">
                <div className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[0.72rem] font-extrabold uppercase tracking-[0.2em] text-red-700">
                  {isTe ? "ఇప్పటికే blacklist‌లో ఉంది" : "Already blacklisted"}
                </div>
                <h2 className="font-manrope text-[1.55rem] font-extrabold tracking-[-0.04em] text-slate-900 sm:text-[1.8rem]">
                  {isTe ? "ఇప్పటికే blacklist ఎంట్రీ కనుగొనబడింది" : "Already Exists"}
                </h2>
                <p className="max-w-2xl font-manrope type-body text-slate-600">
                  {isTe
                    ? "ఈ వ్యక్తి ఇప్పటికే blacklist‌లో ఉన్నారు."
                    : "This person has already been added to the blacklist."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeExistingModal}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label={isTe ? "మోడల్ మూసివేయండి" : "Close modal"}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Info label={isTe ? "రైతు" : "Farmer"} value={existingEntry.farmerName} />
              <Info label="Aadhaar" value={existingEntry.aadhaarMasked || maskNumber(existingEntry.aadhaar)} />
              <Info label="Mobile" value={existingEntry.mobileNumber || "-"} />
              <Info label={isTe ? "ప్రాంతం" : "Location"} value={`${existingEntry.village}, ${existingEntry.mandal}`} />
              <div className="sm:col-span-2">
                <Info label={isTe ? "కారణం" : "Reason"} value={existingEntry.reason} />
              </div>
              <div className="sm:col-span-2">
                <Info label={isTe ? "Blacklist count" : "Blacklist count"} value={String(existingEntry.reportCount ?? 0)} />
              </div>
            </div>

            <div className="mt-6 flex flex-col justify-end gap-3 border-t border-slate-100 pt-4 sm:flex-row">
              {existingEntry.currentDealerReported ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                  {isTe ? "మీరు ఇప్పటికే ఈ వ్యక్తిని report చేశారు." : "You have already reported this person."}
                </div>
              ) : (
                <Button className="w-full sm:w-auto" onClick={() => void handleReportBlacklist()} disabled={reportingBlacklist}>
                  {reportingBlacklist ? (isTe ? "Report చేస్తోంది..." : "Reporting...") : isTe ? "బ్లాక్‌లిస్ట్‌కు add చేయండి" : "Add to blacklist"}
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      ) : null}

        <Footer />
      </main>
    </AuthGuard>
  );
}
