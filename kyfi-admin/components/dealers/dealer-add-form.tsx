"use client";

import { type ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useAdminLanguage } from "@/components/admin-language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchMandals, type MandalRecord } from "@/lib/api/locations";
import { registerDealer } from "@/lib/api/dealers";

type DealerRegisterForm = {
  shopName: string;
  ownerName: string;
  mobile: string;
  password: string;
  district: string;
  state: string;
  mandal: string;
  village: string;
  aadhaarOrGstNumber: string;
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

export function DealerAddForm() {
  const router = useRouter();
  const { t } = useAdminLanguage();
  const districtInputRef = useRef<HTMLInputElement | null>(null);
  const villageInputRef = useRef<HTMLInputElement | null>(null);
  const districtAutocompleteRef = useRef<any>(null);
  const villageAutocompleteRef = useRef<any>(null);
  const [form, setForm] = useState<DealerRegisterForm>({
    shopName: "",
    ownerName: "",
    mobile: "",
    password: "",
    district: "",
    state: "",
    mandal: "",
    village: "",
    aadhaarOrGstNumber: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [mandalOptions, setMandalOptions] = useState<MandalRecord[]>([]);
  const [hideMandalSuggestions, setHideMandalSuggestions] = useState(false);
  const [mandalSearchLoading, setMandalSearchLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const mobilePattern = /^[6-9]\d{9}$/;
  const aadhaarPattern = /^\d{12}$/;
  const gstPattern = /^\d{2}[A-Z0-9]{13}$/;

  function updateField(field: keyof DealerRegisterForm) {
    return (event: ChangeEvent<HTMLInputElement>) => {
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
    };
  }

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

        if (districtInputRef.current) {
          districtAutocompleteRef.current = createAutocomplete(districtInputRef.current, (place) => {
            const value =
              getComponent(place.address_components, [
                "administrative_area_level_2",
                "administrative_area_level_3",
              ]) || place.name || buildAutocompleteLabel(place);

            if (districtInputRef.current) {
              districtInputRef.current.value = value;
              districtInputRef.current.dispatchEvent(new Event("input", { bubbles: true }));
            }

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

            if (villageInputRef.current) {
              villageInputRef.current.value = value;
              villageInputRef.current.dispatchEvent(new Event("input", { bubbles: true }));
            }

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

  async function addDealer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const shopName = form.shopName.trim();
    const ownerName = form.ownerName.trim();
    const mobile = form.mobile.trim();
    const password = form.password.trim();
    const district = form.district.trim();
    const state = form.state.trim();
    const mandal = form.mandal.trim();
    const village = form.village.trim();
    const aadhaarOrGstNumber = form.aadhaarOrGstNumber.trim().toUpperCase();

    if (!shopName || !ownerName || !mobile || !district || !state || !mandal || !village || !aadhaarOrGstNumber) {
      setError(t("dealers.addDescription"));
      return;
    }

    if (!mobilePattern.test(mobile)) {
      setError(t("register.invalidMobile"));
      return;
    }

    if (!aadhaarPattern.test(aadhaarOrGstNumber) && !gstPattern.test(aadhaarOrGstNumber)) {
      setError(t("register.invalidIdentifier"));
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await registerDealer({
        shopName,
        ownerName,
        mobile,
        password: password || undefined,
        district,
        state,
        mandal,
        village,
        aadhaarOrGstNumber,
      });

      router.push("/dashboard/dealers");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t("dealers.failedCreate"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="mb-5 space-y-1">
        <h2 className="text-lg font-semibold text-foreground">{t("dealers.addTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("dealers.addDescription")}</p>
      </div>

      <form className="grid gap-4" onSubmit={addDealer}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-2 text-sm">
            {t("register.state")}
            <select
              value={form.state}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  state: event.target.value,
                  mandal: "",
                }))
              }
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none"
            >
              <option value="" disabled>
                {t("register.stateSelect")}
              </option>
              <option value="Andhra Pradesh">Andhra Pradesh</option>
              <option value="Telangana">Telangana</option>
            </select>
          </label>
          <label className="space-y-2 text-sm">
            {t("register.district")}
            <Input
              ref={districtInputRef}
              value={form.district}
              onChange={updateField("district")}
              autoComplete="off"
              required
              placeholder="Guntur"
            />
          </label>
          <label className="space-y-2 text-sm">
            {t("register.mandal")}
            <div className="space-y-2">
              <Input
                value={form.mandal}
                onChange={updateField("mandal")}
                autoComplete="off"
                required
                placeholder="Tenali"
                disabled={!form.state.trim() || !form.district.trim()}
              />
              {form.state.trim() &&
              form.district.trim() &&
              form.mandal.trim().length >= 2 &&
              !hideMandalSuggestions ? (
                <div className="max-h-56 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                  {mandalSearchLoading ? (
                    <div className="px-4 py-3 text-sm text-slate-500">
                      {t("register.searchingMandals")}
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
                        <span className="text-sm font-semibold text-slate-900">
                          {formatMandalSuggestion(mandal)}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-slate-500">{t("register.noMandal")}</div>
                  )}
                </div>
              ) : null}
            </div>
          </label>
          <label className="space-y-2 text-sm">
            {t("register.village")}
            <Input
              ref={villageInputRef}
              value={form.village}
              onChange={updateField("village")}
              autoComplete="off"
              required
              placeholder="Kollipara"
            />
          </label>
          <label className="space-y-2 text-sm">
            {t("register.shopName")}
            <Input
              value={form.shopName}
              onChange={updateField("shopName")}
              required
              placeholder="Coastal Agri Traders"
            />
          </label>
          <label className="space-y-2 text-sm">
            {t("register.ownerName")}
            <Input
              value={form.ownerName}
              onChange={updateField("ownerName")}
              required
              placeholder="Owner full name"
            />
          </label>
          <label className="space-y-2 text-sm">
            {t("register.mobile")}
            <Input
              value={form.mobile}
              onChange={updateField("mobile")}
              required
              placeholder="9876543210"
              inputMode="tel"
              maxLength={10}
            />
          </label>
          <label className="space-y-2 text-sm">
            {t("register.passwordOptional")}
            <div className="relative">
              <Input
                value={form.password}
                onChange={updateField("password")}
                type={showPassword ? "text" : "password"}
                placeholder={t("register.passwordPlaceholder")}
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>
          <label className="space-y-2 text-sm">
            {t("register.identifier")}
            <Input
              value={form.aadhaarOrGstNumber}
              onChange={updateField("aadhaarOrGstNumber")}
              required
              placeholder={t("register.identifierPlaceholder")}
              maxLength={15}
            />
            <p className="text-xs text-muted-foreground">{t("register.aadhaarHelp")}</p>
          </label>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? t("common.loading") : t("dealers.submit")}
          </Button>
        </div>
      </form>
    </section>
  );
}
