"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Header } from "@/components/kyfi/header";
import { Footer } from "@/components/kyfi/footer";
import { KyfiToast } from "@/components/kyfi/kyfi-toast";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useKyfiLanguage } from "@/components/kyfi/language-provider";
import {
  addBlacklistEntry,
  checkBlacklistEntry,
  type BlacklistEntryRecord,
} from "@/lib/api/blacklist";
import { fetchMandals } from "@/lib/api/locations";

type GooglePlace = {
  formatted_address?: string;
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  name?: string;
};

function maskAadhaar(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) {
    return "XXXX XXXX XXXX";
  }

  return `XXXX XXXX ${digits.slice(-4)}`;
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

const formatMandalSuggestion = (mandal: { districtName: string; mandalName: string; stateName: string }) =>
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="font-manrope type-small text-slate-500">{label}</p>
      <p className="mt-1 font-manrope type-nav text-slate-900">{value}</p>
    </div>
  );
}

export default function AddToBlacklistPage() {
  const { language } = useKyfiLanguage();
  const isTe = language === "te";
  const farmerNameInputRef = useRef<HTMLInputElement | null>(null);
  const aadhaarInputRef = useRef<HTMLInputElement | null>(null);
  const districtInputRef = useRef<HTMLInputElement | null>(null);
  const villageInputRef = useRef<HTMLInputElement | null>(null);
  const districtAutocompleteRef = useRef<any>(null);
  const villageAutocompleteRef = useRef<any>(null);
  const mandalInputRef = useRef<HTMLInputElement | null>(null);
  const reasonInputRef = useRef<HTMLTextAreaElement | null>(null);
  const [form, setForm] = useState({
    farmerName: "",
    aadhaar: "",
    district: "",
    mandal: "",
    village: "",
    reason: "",
    address: "",
  });
  const [fieldErrors, setFieldErrors] = useState({
    farmerName: "",
    aadhaar: "",
    district: "",
    mandal: "",
    village: "",
    reason: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);
  const [aadhaarError, setAadhaarError] = useState("");
  const [existingEntry, setExistingEntry] = useState<BlacklistEntryRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [mandalOptions, setMandalOptions] = useState<Array<{ id: number; stateName: string; districtName: string; mandalName: string }>>([]);
  const [hideMandalSuggestions, setHideMandalSuggestions] = useState(false);
  const [mandalSearchLoading, setMandalSearchLoading] = useState(false);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    tone: "success" | "error";
  }>({
    open: false,
    message: "",
    tone: "success",
  });
  const maskedAadhaar = useMemo(() => maskAadhaar(form.aadhaar), [form.aadhaar]);

  const showToast = (message: string, tone: "success" | "error" = "success") => {
    setToast({ open: true, message, tone });
  };

  useEffect(() => {
    if (!toast.open) return;

    const timeout = window.setTimeout(() => {
      setToast((current) => ({ ...current, open: false }));
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [toast.open]);

  const onChange = (key: keyof typeof form, value: string) => {
    if (key === "aadhaar") {
      const digits = value.replace(/\D/g, "").slice(0, 12);
      setForm((current) => ({ ...current, [key]: digits }));
      setAadhaarError("");
      setFieldErrors((current) => ({ ...current, aadhaar: "" }));
      return;
    }

    setForm((current) => {
      if (key === "district") {
        return { ...current, district: value, mandal: "" };
      }

      if (key === "mandal") {
        return { ...current, mandal: value };
      }

      return { ...current, [key]: value };
    });

    if (key === "district") {
      setHideMandalSuggestions(false);
      setMandalOptions([]);
    }

    if (key === "mandal") {
      setHideMandalSuggestions(false);
    }

    if (key !== "address") {
      setFieldErrors((current) => ({ ...current, [key]: "" }));
    }
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

        if (districtInputRef.current) {
          districtAutocompleteRef.current = createAutocomplete(districtInputRef.current, (place) => {
            const value =
              getComponent(place.address_components, ["administrative_area_level_2", "administrative_area_level_3"]) ||
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
      if (districtAutocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(districtAutocompleteRef.current);
      }
      if (villageAutocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(villageAutocompleteRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const districtName = form.district.trim();
    const mandalQuery = form.mandal.trim();

    if (hideMandalSuggestions || !districtName || mandalQuery.length < 2) {
      setMandalOptions([]);
      setMandalSearchLoading(false);
      return;
    }

    let isCancelled = false;
    setMandalSearchLoading(true);
    const debounce = window.setTimeout(() => {
      fetchMandals({
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
  }, [form.district, form.mandal, hideMandalSuggestions]);

  const submit = async () => {
    setLoading(true);
    setMessage(null);
    setMessageType(null);
    setAadhaarError("");
    setFieldErrors({
      farmerName: "",
      aadhaar: "",
      district: "",
      mandal: "",
      village: "",
      reason: "",
    });
    setModalOpen(false);
    setExistingEntry(null);

    const nextErrors = {
      farmerName: form.farmerName.trim() ? "" : (isTe ? "రైతు పేరు అవసరం." : "Farmer name is required."),
      aadhaar: /^\d{12}$/.test(form.aadhaar)
        ? ""
        : (isTe ? "Aadhaar సంఖ్య 12 అంకెలుగా మాత్రమే ఉండాలి." : "Aadhaar number must be exactly 12 digits."),
      district: form.district.trim() ? "" : (isTe ? "జిల్లా అవసరం." : "District is required."),
      mandal: form.mandal.trim() ? "" : (isTe ? "మండలం అవసరం." : "Mandal is required."),
      village: form.village.trim() ? "" : (isTe ? "గ్రామం అవసరం." : "Village is required."),
      reason: form.reason.trim() ? "" : (isTe ? "కారణం అవసరం." : "Reason is required."),
    };

    setFieldErrors(nextErrors);

    const firstInvalidField = Object.entries(nextErrors).find(([, value]) => Boolean(value))?.[0];
    if (firstInvalidField) {
      setLoading(false);
      if (firstInvalidField === "farmerName") farmerNameInputRef.current?.focus();
      if (firstInvalidField === "aadhaar") aadhaarInputRef.current?.focus();
      if (firstInvalidField === "district") districtInputRef.current?.focus();
      if (firstInvalidField === "mandal") mandalInputRef.current?.focus();
      if (firstInvalidField === "village") villageInputRef.current?.focus();
      if (firstInvalidField === "reason") reasonInputRef.current?.focus();
      return;
    }

    try {
      const checkResponse = await checkBlacklistEntry({ aadhaar: form.aadhaar });

      if (checkResponse.exists && checkResponse.blacklistEntry) {
        setExistingEntry(checkResponse.blacklistEntry);
        setModalOpen(true);
        showToast(isTe ? "ఇప్పటికే blacklist ఎంట్రీ ఉంది." : "Existing blacklist entry found.");
        return;
      }

      await addBlacklistEntry({
        aadhaar: form.aadhaar,
        farmerName: form.farmerName.trim(),
        district: form.district.trim(),
        mandal: form.mandal.trim(),
        village: form.village.trim(),
        reason: form.reason.trim(),
        address: form.address.trim(),
      });

      setMessage(isTe ? "Blacklist ఎంట్రీ విజయవంతంగా జోడించబడింది" : "Blacklist entry added successfully");
      setMessageType("success");
      showToast(isTe ? "Blacklist ఎంట్రీ విజయవంతంగా జోడించబడింది" : "Blacklist entry added successfully");
      setForm({
        farmerName: "",
        aadhaar: "",
        district: "",
        mandal: "",
        village: "",
        reason: "",
        address: "",
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : isTe ? "Blacklist ఎంట్రీని సేవ్ చేయలేకపోయాము" : "Unable to save blacklist entry");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="kyfi-shell min-h-screen">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-8 max-w-3xl"
        >
          <h1 className="mt-3 font-manrope type-section text-slate-900">
            {isTe ? "Blacklistకు జోడించండి" : "Add to Blacklist"}
          </h1>
        </motion.div>

        {message ? (
          <div className="mb-6 max-w-3xl">
            <Alert variant={messageType === "error" ? "destructive" : "default"}>
              {message}
            </Alert>
          </div>
        ) : null}

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
          >
            <Card className="overflow-hidden border-white/80 bg-white/85 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <CardContent className="space-y-6 p-6 sm:p-8">
                <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="font-manrope type-nav text-slate-800">{isTe ? "రైతు పేరు" : "Farmer name"} <span className="text-red-500">*</span></label>
                  <Input
                    ref={farmerNameInputRef}
                    placeholder={isTe ? "రైతు పేరును నమోదు చేయండి" : "Enter farmer name"}
                    value={form.farmerName}
                    onChange={(event) => onChange("farmerName", event.target.value)}
                    aria-invalid={Boolean(fieldErrors.farmerName)}
                    className={fieldErrors.farmerName ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-100" : ""}
                  />
                  {fieldErrors.farmerName ? (
                    <p className="font-manrope text-sm text-red-600">{fieldErrors.farmerName}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label className="font-manrope type-nav text-slate-800">{isTe ? "Aadhaar సంఖ్య" : "Aadhaar number"} <span className="text-red-500">*</span></label>
                  <Input
                    ref={aadhaarInputRef}
                    placeholder={isTe ? "12 అంకెల Aadhaar నమోదు చేయండి" : "Enter 12-digit Aadhaar"}
                    value={form.aadhaar}
                    onChange={(event) => onChange("aadhaar", event.target.value)}
                    inputMode="numeric"
                    maxLength={12}
                    aria-invalid={Boolean(aadhaarError || fieldErrors.aadhaar)}
                    className={(aadhaarError || fieldErrors.aadhaar) ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-100" : ""}
                  />
                  <p className="font-manrope type-small text-slate-500">
                    {isTe ? "కేవలం 12 అంకెలు మాత్రమే. స్పేస్‌లు అవసరం లేదు." : "Enter only 12 digits. Spaces are not needed."}
                  </p>
                  {(aadhaarError || fieldErrors.aadhaar) ? (
                    <p className="font-manrope text-sm text-red-600">{aadhaarError || fieldErrors.aadhaar}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label className="font-manrope type-nav text-slate-800">{isTe ? "జిల్లా" : "District"} <span className="text-red-500">*</span></label>
                  <Input
                    ref={districtInputRef}
                    placeholder={isTe ? "జిల్లాను నమోదు చేయండి" : "Enter district"}
                    value={form.district}
                    onChange={(event) => onChange("district", event.target.value)}
                    aria-invalid={Boolean(fieldErrors.district)}
                    className={fieldErrors.district ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-100" : ""}
                  />
                  {fieldErrors.district ? (
                    <p className="font-manrope text-sm text-red-600">{fieldErrors.district}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label className="font-manrope type-nav text-slate-800">{isTe ? "మండలం" : "Mandal"} <span className="text-red-500">*</span></label>
                  <div className="relative space-y-2">
                    <Input
                      ref={mandalInputRef}
                      placeholder={
                        form.district.trim()
                          ? (isTe ? "2 లేదా అంతకంటే ఎక్కువ అక్షరాలు టైప్ చేయండి" : "Type 2 or more letters")
                          : (isTe ? "ముందు జిల్లాను ఎంచుకోండి" : "Select district first")
                      }
                      value={form.mandal}
                      onChange={(event) => onChange("mandal", event.target.value)}
                      disabled={!form.district.trim()}
                      aria-invalid={Boolean(fieldErrors.mandal)}
                      className={fieldErrors.mandal ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-100" : ""}
                    />
                    {form.district.trim() && form.mandal.trim().length >= 2 && !hideMandalSuggestions ? (
                      <div className="absolute left-0 top-full z-20 mt-2 max-h-56 w-full overflow-auto rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                        {mandalSearchLoading ? (
                          <div className="px-4 py-3 font-manrope text-sm text-slate-500">
                            {isTe ? "మండలాలను వెతుకుతోంది..." : "Searching mandals..."}
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
                            {isTe ? "సరిపోలే మండలం కనబడలేదు." : "No matching mandal found."}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                  {fieldErrors.mandal ? (
                    <p className="font-manrope text-sm text-red-600">{fieldErrors.mandal}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label className="font-manrope type-nav text-slate-800">{isTe ? "గ్రామం" : "Village"} <span className="text-red-500">*</span></label>
                  <Input
                    ref={villageInputRef}
                    placeholder={isTe ? "గ్రామాన్ని నమోదు చేయండి" : "Enter village"}
                    value={form.village}
                    onChange={(event) => onChange("village", event.target.value)}
                    aria-invalid={Boolean(fieldErrors.village)}
                    className={fieldErrors.village ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-100" : ""}
                  />
                  {fieldErrors.village ? (
                    <p className="font-manrope text-sm text-red-600">{fieldErrors.village}</p>
                  ) : null}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="font-manrope type-nav text-slate-800">{isTe ? "కారణం" : "Reason"} <span className="text-red-500">*</span></label>
                  <textarea
                    ref={reasonInputRef}
                    value={form.reason}
                    onChange={(event) => onChange("reason", event.target.value)}
                    placeholder={isTe ? "నిర్ధారిత బాకీకి కారణాన్ని వివరించండి" : "Explain the confirmed unpaid dues reason"}
                    aria-invalid={Boolean(fieldErrors.reason)}
                    className={[
                      "min-h-[120px] w-full rounded-xl border border-input bg-background px-4 py-3 font-manrope type-body text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      fieldErrors.reason ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-100" : "",
                    ].join(" ")}
                  />
                  {fieldErrors.reason ? (
                    <p className="font-manrope text-sm text-red-600">{fieldErrors.reason}</p>
                  ) : null}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="font-manrope type-nav text-slate-800">
                    {isTe ? <>చిరునామా <span className="text-slate-400">(ఐచ్ఛికం)</span></> : <>Address <span className="text-slate-400">(optional)</span></>}
                  </label>
                  <Input
                    placeholder={isTe ? "సందర్భానికి ఐచ్ఛిక చిరునామా" : "Optional address for reference"}
                    value={form.address}
                    onChange={(event) => onChange("address", event.target.value)}
                  />
                </div>
              </div>

                <div className="flex justify-end">
                  <Button
                    className="w-full !bg-[rgb(4,120,87)] !text-white hover:!bg-[rgb(4,120,87)] hover:brightness-105 sm:w-auto sm:min-w-[280px] lg:min-w-[320px]"
                    size="lg"
                    onClick={submit}
                    disabled={loading}
                  >
                    {loading ? (isTe ? "సేవ్ చేస్తోంది..." : "Saving...") : (isTe ? "Blacklist ఎంట్రీ జోడించండి" : "Add blacklist entry")}
                  </Button>
                </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <KyfiToast
        open={toast.open}
        message={toast.message}
        tone={toast.tone}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
      />

      {modalOpen && existingEntry ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
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
                  {isTe ? "ఇప్పటికే blacklist ఎంట్రీ కనుగొనబడింది" : "Existing blacklist entry found"}
                </h2>
                <p className="max-w-2xl font-manrope type-body text-slate-600">
                  {isTe
                    ? "ఈ Aadhaar ఇప్పటికే blacklist‌లో ఉంది. కొత్తదాన్ని సృష్టించకుండా ఉన్న రికార్డును చూడండి."
                    : "This Aadhaar is already in the blacklist. Review the existing record below instead of creating a duplicate."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label={isTe ? "మోడల్ మూసివేయండి" : "Close modal"}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Info label={isTe ? "రైతు" : "Farmer"} value={existingEntry.farmerName} />
              <Info label="Aadhaar" value={existingEntry.aadhaarMasked} />
              <Info label={isTe ? "ప్రాంతం" : "Location"} value={`${existingEntry.village}, ${existingEntry.mandal}`} />
              <Info label={isTe ? "జిల్లా" : "District"} value={existingEntry.district} />
              <div className="sm:col-span-2">
                <Info label={isTe ? "కారణం" : "Reason"} value={existingEntry.reason} />
              </div>
            </div>

            <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                {isTe ? "మూసివేయండి" : "Close"}
              </Button>
            </div>
          </motion.div>
        </div>
      ) : null}

      <Footer />
    </main>
  );
}

