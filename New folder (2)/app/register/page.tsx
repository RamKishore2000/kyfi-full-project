"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Leaf, Smartphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { KyfiToast } from "@/components/kyfi/kyfi-toast";
import { registerDealer } from "@/lib/api/auth";
import { fetchMandals, type MandalRecord } from "@/lib/api/locations";
import { getKyfiDictionary } from "@/lib/kyfi-i18n";

type RegisterForm = {
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

const normalizeText = (value: string) => value.trim().toLowerCase();

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

const buildAutocompleteLabel = (place: GooglePlace) =>
  place.formatted_address || place.name || "";

const formatMandalSuggestion = (mandal: MandalRecord) =>
  `${mandal.mandalName} mandal, ${mandal.districtName} district, ${mandal.stateName}`;

const registerGreenButtonClass =
  "rounded-full bg-[rgb(4,120,87)] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-105";

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

export default function RegisterPage() {
  const router = useRouter();
  const english = getKyfiDictionary("en");
  const t = (key: string) => english[key] ?? key;
  const stateInputRef = useRef<HTMLInputElement | null>(null);
  const districtInputRef = useRef<HTMLInputElement | null>(null);
  const villageInputRef = useRef<HTMLInputElement | null>(null);
  const mandalInputRef = useRef<HTMLInputElement | null>(null);
  const shopNameInputRef = useRef<HTMLInputElement | null>(null);
  const ownerNameInputRef = useRef<HTMLInputElement | null>(null);
  const mobileInputRef = useRef<HTMLInputElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const identifierInputRef = useRef<HTMLInputElement | null>(null);
  const stateAutocompleteRef = useRef<any>(null);
  const districtAutocompleteRef = useRef<any>(null);
  const villageAutocompleteRef = useRef<any>(null);
  const [form, setForm] = useState<RegisterForm>({
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
  const [mandalOptions, setMandalOptions] = useState<MandalRecord[]>([]);
  const [hideMandalSuggestions, setHideMandalSuggestions] = useState(false);
  const [mandalSearchLoading, setMandalSearchLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    tone: "success" | "error";
  }>({
    open: false,
    message: "",
    tone: "success",
  });
  const [redirectAfterToast, setRedirectAfterToast] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    state: "",
    district: "",
    mandal: "",
    village: "",
    shopName: "",
    ownerName: "",
    mobile: "",
    password: "",
    aadhaarOrGstNumber: "",
  });
  const mobilePattern = /^[6-9]\d{9}$/;
  const aadhaarPattern = /^\d{12}$/;
  const gstPattern = /^\d{2}[A-Z0-9]{13}$/;
  const isMandalDisabled = !form.state.trim() || !form.district.trim();
  const mandalPlaceholder = isMandalDisabled ? "Select district first" : "Type 2 more letters";

  const showToast = (message: string, tone: "success" | "error" = "success") => {
    setToast({ open: true, message, tone });
  };

  const handleChange =
    (field: keyof RegisterForm) =>
    (event: ChangeEvent<HTMLInputElement>) => {
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

      setFieldErrors((current) => ({ ...current, [field]: "" }));
    };

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

        const createAutocomplete = (input: HTMLInputElement, onPlaceSelected: (place: GooglePlace) => void) => {
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
              ]) ||
              place.name ||
              buildAutocompleteLabel(place);

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
      (entry) => normalizeText(entry.mandalName) === normalizeText(form.mandal),
    );

    if (!match) {
      return;
    }
  }, [form.mandal, mandalOptions]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setFieldErrors({
      state: "",
      district: "",
      mandal: "",
      village: "",
      shopName: "",
      ownerName: "",
      mobile: "",
      password: "",
      aadhaarOrGstNumber: "",
    });

    const nextErrors = {
      state: form.state.trim() ? "" : "State is required.",
      district: form.district.trim() ? "" : "District is required.",
      mandal: form.mandal.trim() ? "" : "Mandal is required.",
      village: form.village.trim() ? "" : "Village is required.",
      shopName: form.shopName.trim() ? "" : "Shop name is required.",
      ownerName: form.ownerName.trim() ? "" : "Owner name is required.",
      mobile: mobilePattern.test(form.mobile.trim()) ? "" : "Enter a valid 10-digit mobile number.",
      aadhaarOrGstNumber:
        aadhaarPattern.test(form.aadhaarOrGstNumber.trim().toUpperCase()) ||
        gstPattern.test(form.aadhaarOrGstNumber.trim().toUpperCase())
          ? ""
          : "Enter a valid Aadhaar number or GST number.",
      password: "",
    };

    setFieldErrors(nextErrors);

    const firstInvalidField = Object.entries(nextErrors).find(([, value]) => Boolean(value))?.[0];
    if (firstInvalidField) {
      if (firstInvalidField === "state") stateInputRef.current?.focus();
      if (firstInvalidField === "district") districtInputRef.current?.focus();
      if (firstInvalidField === "mandal") mandalInputRef.current?.focus();
      if (firstInvalidField === "village") villageInputRef.current?.focus();
      if (firstInvalidField === "shopName") shopNameInputRef.current?.focus();
      if (firstInvalidField === "ownerName") ownerNameInputRef.current?.focus();
      if (firstInvalidField === "mobile") mobileInputRef.current?.focus();
      if (firstInvalidField === "aadhaarOrGstNumber") identifierInputRef.current?.focus();
      return;
    }

    if (!mobilePattern.test(form.mobile.trim())) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    const identifier = form.aadhaarOrGstNumber.trim().toUpperCase();
    const isValidAadhaar = aadhaarPattern.test(identifier);
    const isValidGst = gstPattern.test(identifier);

    if (!isValidAadhaar && !isValidGst) {
      setError("Enter a valid Aadhaar number or GST number.");
      return;
    }

    setIsSubmitting(true);

    try {
      await registerDealer({
        shopName: form.shopName.trim(),
        ownerName: form.ownerName.trim(),
        mobile: form.mobile.trim(),
        password: form.password.trim() || undefined,
        district: form.district.trim(),
        state: form.state.trim(),
        mandal: form.mandal.trim(),
        village: form.village.trim(),
        aadhaarOrGstNumber: identifier,
      });

      setRedirectAfterToast(true);
      showToast("Registration successful");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Registration failed",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8F7F4] px-2 py-2 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
      <section className="grid min-h-[calc(100vh-1rem)] overflow-hidden rounded-[28px] bg-[#F8F7F4] shadow-[0_0_0_1px_rgba(17,24,39,0.04)] lg:min-h-[calc(100vh-3rem)] lg:grid-cols-2 lg:rounded-[34px]">
        <div className="order-2 hidden min-h-[280px] lg:order-1 lg:sticky lg:top-0 lg:block lg:h-screen">
          <div className="relative h-full w-full overflow-hidden">
            <img
              src="/loginbanner.png"
              alt="KYFI dealer illustration"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          </div>
        </div>

        <div className="order-1 flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#F8F7F4_0%,#F6F0E7_100%)] px-4 py-2 lg:order-2 lg:px-6">
          <div className="w-full max-w-[34rem] lg:mx-auto lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:px-2 no-scrollbar">
            <div className="space-y-5 px-1 py-1 sm:px-2 sm:py-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[rgb(4,120,87)] text-white">
                      <Leaf className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-manrope text-[1.6rem] font-black leading-none tracking-[-0.05em] text-[rgb(4,120,87)]">
                        KYFI
                      </p>
                      <p className="hidden font-manrope text-[0.64rem] font-semibold uppercase tracking-[0.24em] text-slate-500 lg:block">
                        KNOW YOUR FARMER INFORMATION
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 rounded-full border border-[#D9D5C8] bg-[#FAF8F2] px-4 py-2 text-slate-700">
                    <Smartphone className="h-4 w-4 text-[rgb(4,120,87)]" />
                    <span className="font-manrope text-[0.82rem] font-medium">{t("login.mobilePhone")}</span>
                  </div>
                </div>

                <p className="font-manrope text-[0.96rem] font-medium tracking-[0.02em] text-slate-700">
                  {t("register.dealerAccess")}
                </p>

                <div className="grid grid-cols-2 rounded-full bg-[#EEF0EA] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.78)]">
                  <Link
                    href="/login"
                    className="rounded-full px-4 py-3 text-center text-sm font-semibold text-slate-600 transition hover:text-[rgb(4,120,87)]"
                  >
                    {t("register.login")}
                  </Link>
                  <button
                    type="button"
                    className={registerGreenButtonClass}
                  >
                    {t("register.register")}
                  </button>
                </div>

                <form className="space-y-3" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label className="font-manrope type-nav text-slate-800">
                      {t("register.state")} <span className="text-red-500">*</span>
                    </label>
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
                      aria-invalid={Boolean(fieldErrors.state)}
                      className={[
                        "flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 font-manrope type-nav text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100",
                        fieldErrors.state ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "",
                      ].join(" ")}
                    >
                      <option value="" disabled>
                        {t("register.stateSelect")}
                      </option>
                      <option value="Andhra Pradesh">Andhra Pradesh</option>
                      <option value="Telangana">Telangana</option>
                    </select>
                    {fieldErrors.state ? (
                      <p className="font-manrope text-sm text-red-600">{fieldErrors.state}</p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label className="font-manrope type-nav text-slate-800">
                      {t("register.district")} <span className="text-red-500">*</span>
                    </label>
                    <Input
                      ref={districtInputRef}
                      placeholder={t("register.districtPlaceholder")}
                      value={form.district}
                      onChange={handleChange("district")}
                      required
                      aria-invalid={Boolean(fieldErrors.district)}
                      className={fieldErrors.district ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-100" : ""}
                    />
                    {fieldErrors.district ? (
                      <p className="font-manrope text-sm text-red-600">{fieldErrors.district}</p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label className="font-manrope type-nav text-slate-800">
                      {t("register.mandal")} <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      <Input
                        ref={mandalInputRef}
                        placeholder={mandalPlaceholder}
                        value={form.mandal}
                        onChange={handleChange("mandal")}
                        disabled={isMandalDisabled}
                        required
                        aria-invalid={Boolean(fieldErrors.mandal)}
                        className={fieldErrors.mandal ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-100" : ""}
                      />
                      {form.state.trim() &&
                      form.district.trim() &&
                      form.mandal.trim().length >= 2 &&
                      !hideMandalSuggestions ? (
                        <div className="max-h-56 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                          {mandalSearchLoading ? (
                            <div className="px-4 py-3 font-manrope text-sm text-slate-500">
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
                                <span className="font-manrope text-sm font-semibold text-slate-900">
                                  {formatMandalSuggestion(mandal)}
                                </span>
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-3 font-manrope text-sm text-slate-500">
                              {t("register.noMandal")}
                            </div>
                          )}
                        </div>
                      ) : null}
                      {fieldErrors.mandal ? (
                        <p className="font-manrope text-sm text-red-600">{fieldErrors.mandal}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="font-manrope type-nav text-slate-800">
                      {t("register.village")} <span className="text-red-500">*</span>
                    </label>
                      <Input
                        ref={villageInputRef}
                        placeholder={t("register.villagePlaceholder")}
                        value={form.village}
                        onChange={handleChange("village")}
                        required
                        aria-invalid={Boolean(fieldErrors.village)}
                        className={fieldErrors.village ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-100" : ""}
                    />
                    {fieldErrors.village ? (
                      <p className="font-manrope text-sm text-red-600">{fieldErrors.village}</p>
                    ) : null}
                  </div>

                  <div className="grid gap-3">
                    <div className="space-y-2">
                      <label className="font-manrope type-nav text-slate-800">
                        {t("register.shopName")} <span className="text-red-500">*</span>
                      </label>
                      <Input
                        ref={shopNameInputRef}
                        placeholder={t("register.shopPlaceholder")}
                        value={form.shopName}
                        onChange={handleChange("shopName")}
                        required
                        aria-invalid={Boolean(fieldErrors.shopName)}
                        className={fieldErrors.shopName ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-100" : ""}
                      />
                      {fieldErrors.shopName ? (
                        <p className="font-manrope text-sm text-red-600">{fieldErrors.shopName}</p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <label className="font-manrope type-nav text-slate-800">
                        {t("register.ownerName")} <span className="text-red-500">*</span>
                      </label>
                      <Input
                        ref={ownerNameInputRef}
                        placeholder={t("register.ownerPlaceholder")}
                        value={form.ownerName}
                        onChange={handleChange("ownerName")}
                        required
                        aria-invalid={Boolean(fieldErrors.ownerName)}
                        className={fieldErrors.ownerName ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-100" : ""}
                      />
                      {fieldErrors.ownerName ? (
                        <p className="font-manrope text-sm text-red-600">{fieldErrors.ownerName}</p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <label className="font-manrope type-nav text-slate-800">
                        {t("register.mobile")} <span className="text-red-500">*</span>
                      </label>
                      <Input
                        ref={mobileInputRef}
                        placeholder={t("register.mobilePlaceholder")}
                        inputMode="tel"
                        maxLength={10}
                        value={form.mobile}
                        onChange={handleChange("mobile")}
                        required
                        aria-invalid={Boolean(fieldErrors.mobile)}
                        className={fieldErrors.mobile ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-100" : ""}
                      />
                      {fieldErrors.mobile ? (
                        <p className="font-manrope text-sm text-red-600">{fieldErrors.mobile}</p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <label className="font-manrope type-nav text-slate-800">
                        {t("register.passwordOptional")}
                      </label>
                      <div className="relative">
                        <Input
                          ref={passwordInputRef}
                          type={showPassword ? "text" : "password"}
                          placeholder={t("register.passwordPlaceholder")}
                          value={form.password}
                          onChange={handleChange("password")}
                          aria-invalid={Boolean(fieldErrors.password)}
                          className={[
                            fieldErrors.password ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-100" : "",
                            "pr-11",
                          ].join(" ")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {fieldErrors.password ? (
                        <p className="font-manrope text-sm text-red-600">{fieldErrors.password}</p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <label className="font-manrope type-nav text-slate-800">
                        {t("register.identifier")} <span className="text-red-500">*</span>
                      </label>
                      <Input
                        ref={identifierInputRef}
                        placeholder={t("register.identifierPlaceholder")}
                        maxLength={15}
                        value={form.aadhaarOrGstNumber}
                        onChange={handleChange("aadhaarOrGstNumber")}
                        required
                        aria-invalid={Boolean(fieldErrors.aadhaarOrGstNumber)}
                        className={fieldErrors.aadhaarOrGstNumber ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-100" : ""}
                      />
                      <p className="font-manrope type-small text-slate-500">
                        {t("register.aadhaarHelp")}
                      </p>
                      {fieldErrors.aadhaarOrGstNumber ? (
                        <p className="font-manrope text-sm text-red-600">{fieldErrors.aadhaarOrGstNumber}</p>
                      ) : null}
                    </div>
                  </div>

                  {error ? <p className="font-manrope type-small text-red-600">{error}</p> : null}

                  <Button
                    size="lg"
                    className="w-full !bg-[rgb(4,120,87)] !text-white hover:!bg-[rgb(4,120,87)] hover:brightness-105"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? t("register.loading") : t("register.submit")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
            </div>
          </div>
        </div>
      </section>

      <KyfiToast
        open={toast.open}
        message={toast.message}
        tone={toast.tone}
        onClose={() => {
          setToast((current) => ({ ...current, open: false }));
          if (redirectAfterToast) {
            setRedirectAfterToast(false);
            router.push("/login");
          }
        }}
      />
    </main>
  );
}
