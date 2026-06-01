"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Footer } from "@/components/kyfi/footer";
import { AuthGuard } from "@/components/kyfi/auth-guard";
import { Header } from "@/components/kyfi/header";
import { KyfiToast } from "@/components/kyfi/kyfi-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchCurrentDealer, updateCurrentDealerProfile } from "@/lib/api/profile";
import { fetchMandals, type MandalRecord } from "@/lib/api/locations";
import { useKyfiLanguage } from "@/components/kyfi/language-provider";

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

export default function ProfilePage() {
  const { t } = useKyfiLanguage();
  const stateInputRef = useRef<HTMLInputElement | null>(null);
  const districtInputRef = useRef<HTMLInputElement | null>(null);
  const villageInputRef = useRef<HTMLInputElement | null>(null);
  const stateAutocompleteRef = useRef<any>(null);
  const districtAutocompleteRef = useRef<any>(null);
  const villageAutocompleteRef = useRef<any>(null);
  const [form, setForm] = useState({
    name: "",
    shopName: "",
    mobile: "",
    district: "",
    state: "",
    mandal: "",
    village: "",
  });
  const [mandalOptions, setMandalOptions] = useState<MandalRecord[]>([]);
  const [hideMandalSuggestions, setHideMandalSuggestions] = useState(false);
  const [mandalSearchLoading, setMandalSearchLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
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

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetchCurrentDealer();
        const dealer = response.dealer;

        setForm({
          name: dealer.name ?? "",
          shopName: dealer.shopName ?? "",
          mobile: dealer.mobile ?? "",
          district: dealer.district ?? "",
          state: dealer.state ?? "",
          mandal: dealer.mandal ?? "",
          village: dealer.village ?? "",
        });
        setHideMandalSuggestions(false);
        setMandalOptions([]);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : t("profile.loadFailed"));
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [t]);

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

        const createAutocomplete = (
          input: HTMLInputElement,
          onPlaceSelected: (place: GooglePlace) => void,
        ) => {
          const autocomplete = new window.google.maps.places.Autocomplete(input, {
            fields: ["formatted_address", "address_components", "name"],
            types: ["geocode"],
            componentRestrictions: { country: "in" },
          });

          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace() as GooglePlace | undefined;
            if (!place) return;
            onPlaceSelected(place);
          });

          return autocomplete;
        };

        if (stateInputRef.current) {
          stateAutocompleteRef.current = createAutocomplete(stateInputRef.current, (place) => {
            const value =
              getComponent(place.address_components, ["administrative_area_level_1"]) ||
              place.name ||
              buildAutocompleteLabel(place);

            setForm((current) => ({
              ...current,
              state: value,
              mandal: "",
            }));
          });
        }

        if (districtInputRef.current) {
          districtAutocompleteRef.current = createAutocomplete(districtInputRef.current, (place) => {
            const value =
              getComponent(place.address_components, [
                "administrative_area_level_2",
                "administrative_area_level_3",
              ]) || place.name || buildAutocompleteLabel(place);

            setForm((current) => ({
              ...current,
              district: value,
              mandal: "",
            }));
          });
        }

        if (villageInputRef.current) {
          villageAutocompleteRef.current = createAutocomplete(villageInputRef.current, (place) => {
            const value =
              getComponent(place.address_components, [
                "locality",
                "sublocality_level_1",
                "sublocality",
                "neighborhood",
                "administrative_area_level_3",
              ]) || place.name || buildAutocompleteLabel(place);

            setForm((current) => ({
              ...current,
              village: value,
            }));
          });
        }
      })
      .catch(() => {
        // Keep manual entry available if Places fails to load.
      });

    return () => {
      isCancelled = true;
      if (stateAutocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(stateAutocompleteRef.current);
      }
      if (districtAutocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(districtAutocompleteRef.current);
      }
      if (villageAutocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(villageAutocompleteRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const stateName = form.state.trim();
    const districtName = form.district.trim();
    const mandalQuery = form.mandal.trim();

    if (hideMandalSuggestions || !stateName || !districtName || mandalQuery.length < 2) {
      setMandalOptions([]);
      setMandalSearchLoading(false);
      return;
    }

    let isCancelled = false;
    setMandalSearchLoading(true);

    const debounce = window.setTimeout(() => {
      fetchMandals({
        state: stateName,
        district: districtName,
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
  }, [form.state, form.district, form.mandal, hideMandalSuggestions]);

  useEffect(() => {
    if (!form.mandal.trim() || !mandalOptions.length) {
      return;
    }

    const match = mandalOptions.find(
      (entry) => entry.mandalName.trim().toLowerCase() === form.mandal.trim().toLowerCase(),
    );

    if (!match) {
      return;
    }
  }, [form.mandal, mandalOptions]);

  const handleChange = (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    setForm((current) => {
      if (field === "state") {
        return { ...current, state: value, mandal: "" };
      }

      if (field === "district") {
        return { ...current, district: value, mandal: "" };
      }

      return { ...current, [field]: value };
    });

    if (field === "mandal") {
      setHideMandalSuggestions(false);
    }

    setError("");
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError("");

    try {
      const response = await updateCurrentDealerProfile({
        name: form.name.trim(),
        shopName: form.shopName.trim(),
        mobile: form.mobile.trim(),
        district: form.district.trim(),
        state: form.state.trim(),
        mandal: form.mandal.trim(),
        village: form.village.trim(),
      });

      const dealer = response.dealer;
      setForm({
        name: dealer.name ?? "",
        shopName: dealer.shopName ?? "",
        mobile: dealer.mobile ?? "",
        district: dealer.district ?? "",
        state: dealer.state ?? "",
        mandal: dealer.mandal ?? "",
        village: dealer.village ?? "",
      });
      const successMessage = response.message || t("profile.updated");
      showToast(successMessage);
    } catch (submitError) {
      const nextError =
        submitError instanceof Error ? submitError.message : t("profile.updateFailed");
      setError(nextError);
      showToast(nextError, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthGuard>
      <main className="kyfi-shell min-h-screen">
        <Header />

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-3xl">
            <p className="font-manrope type-small uppercase tracking-[0.2em] text-emerald-700">
              {t("profile.title")}
            </p>
            <h1 className="mt-3 font-manrope type-section text-slate-900">{t("profile.title")}</h1>
            <p className="mt-4 font-manrope type-body text-slate-600">{t("profile.onlyApproved")}</p>
          </div>

          {loading ? (
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white/80 p-4 font-manrope type-body text-slate-600 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              {t("profile.loading")}
            </div>
          ) : null}

          {error ? (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-manrope type-body text-red-700">
              {error}
            </div>
          ) : null}

          <Card className="overflow-hidden border-white/80 bg-white/85 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <CardContent className="space-y-6 p-6 sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-manrope type-nav text-slate-900">{t("profile.fields")}</p>
                  <h2 className="mt-1 font-manrope type-card text-slate-900">{t("profile.details")}</h2>
                </div>
                <Badge variant="secondary">{t("profile.approvedDealer")}</Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="font-manrope type-nav text-slate-800">{t("profile.dealerName")}</label>
                  <Input value={form.name} onChange={handleChange("name")} />
                </div>

                <div className="space-y-2">
                  <label className="font-manrope type-nav text-slate-800">{t("profile.shopName")}</label>
                  <Input value={form.shopName} onChange={handleChange("shopName")} />
                </div>

                <div className="space-y-2">
                  <label className="font-manrope type-nav text-slate-800">{t("profile.mobile")}</label>
                  <Input value={form.mobile} onChange={handleChange("mobile")} inputMode="tel" />
                </div>

                <div className="space-y-2">
                  <label className="font-manrope type-nav text-slate-800">{t("profile.state")}</label>
                  <select
                    value={form.state}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        state: event.target.value,
                        mandal: "",
                      }))
                    }
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 font-manrope type-body text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="" disabled>
                      Select state
                    </option>
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                    <option value="Telangana">Telangana</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="font-manrope type-nav text-slate-800">{t("profile.district")}</label>
                  <Input
                    ref={districtInputRef}
                    value={form.district}
                    onChange={handleChange("district")}
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-manrope type-nav text-slate-800">{t("profile.mandal")}</label>
                  <div className="space-y-2">
                    <Input
                      value={form.mandal}
                      onChange={handleChange("mandal")}
                      disabled={!form.state.trim() || !form.district.trim()}
                    />
                    {form.state.trim() &&
                    form.district.trim() &&
                    form.mandal.trim().length >= 2 &&
                    !hideMandalSuggestions ? (
                      <div className="max-h-56 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                        {mandalSearchLoading ? (
                          <div className="px-4 py-3 font-manrope text-sm text-slate-500">
                            {t("profile.loading")}
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
                            {t("profile.noMandal")}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="font-manrope type-nav text-slate-800">{t("profile.village")}</label>
                  <Input
                    ref={villageInputRef}
                    value={form.village}
                    onChange={handleChange("village")}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  size="lg"
                  className="w-full !bg-[rgb(4,120,87)] !text-white hover:!bg-[rgb(4,120,87)] hover:brightness-105 sm:w-auto sm:min-w-[280px] lg:min-w-[320px]"
                  onClick={handleSubmit}
                  disabled={saving}
                >
                  {saving ? t("profile.saving") : t("profile.update")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <KyfiToast
          open={toast.open}
          message={toast.message}
          tone={toast.tone}
          onClose={() => setToast((current) => ({ ...current, open: false }))}
        />

        <Footer />
      </main>
    </AuthGuard>
  );
}
