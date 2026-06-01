"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { BlacklistWarning } from "@/components/kyfi/blacklist-warning";
import { useKyfiLanguage } from "@/components/kyfi/language-provider";
import { Footer } from "@/components/kyfi/footer";
import { Header } from "@/components/kyfi/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchMandals, type MandalRecord } from "@/lib/api/locations";
import {
  searchBlacklistEntries,
  type BlacklistEntryRecord,
} from "@/lib/api/blacklist";

type GooglePlace = {
  formatted_address?: string;
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  name?: string;
};

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

export default function BlacklistBrowserPage() {
  const { t } = useKyfiLanguage();
  const mandalInputRef = useRef<HTMLInputElement | null>(null);
  const villageInputRef = useRef<HTMLInputElement | null>(null);
  const villageAutocompleteRef = useRef<any>(null);

  const [form, setForm] = useState({
    mandal: "",
    village: "",
  });
  const [mandalOptions, setMandalOptions] = useState<MandalRecord[]>([]);
  const [mandalSearchLoading, setMandalSearchLoading] = useState(false);
  const [hideMandalSuggestions, setHideMandalSuggestions] = useState(false);
  const [entries, setEntries] = useState<BlacklistEntryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
      setMessage(response.entries.length ? null : t("blacklist.noRecordFound"));
    } catch (error) {
      setEntries([]);
      setSearched(true);
      setMessage(error instanceof Error ? error.message : t("blacklist.unable"));
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
            <h1 className="mt-3 font-manrope type-section text-slate-900">
              {t("blacklist.review")}
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
          >
            <div className="space-y-5">
              <BlacklistWarning />
              <div className="relative z-30 space-y-4 border-t border-slate-200 pt-4">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
                  <div className="relative space-y-2">
                    <label className="font-manrope type-nav text-slate-800">{t("blacklist.mandalLabel")}</label>
                    <Input
                      ref={mandalInputRef}
                      placeholder={t("blacklist.placeholderMandal")}
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
                            {t("blacklist.searching")}
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
                      value={form.village}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, village: event.target.value }))
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

              <div className="space-y-4 border-t border-slate-200 pt-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="mt-2 font-manrope type-card text-slate-900">
                      {t("blacklist.records")}
                    </h2>
                  </div>
                  <Badge variant="destructive">{entries.length} {t("blacklist.found")}</Badge>
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
                            <p className="font-manrope type-card capitalize text-slate-900">
                              {entry.farmerName}
                            </p>
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
                                  {t("blacklist.districtLabel")}
                                </p>
                                <p className="mt-1 font-manrope type-body leading-6 text-slate-700">
                                  {entry.district}
                                </p>
                              </div>
                              <div>
                                <p className="font-manrope type-small uppercase tracking-[0.16em] text-slate-500">
                                  {t("blacklist.maskedLabel")}
                                </p>
                                <p className="mt-1 font-manrope type-body leading-6 text-slate-700">
                                  {entry.aadhaarMasked}
                                </p>
                              </div>
                            </div>
                          </div>
                          <Badge variant="destructive">{t("blacklist.blacklisted")}</Badge>
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
          </motion.div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

