"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Header } from "@/components/kyfi/header";
import { Footer } from "@/components/kyfi/footer";
import { KyfiToast } from "@/components/kyfi/kyfi-toast";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useKyfiLanguage } from "@/components/kyfi/language-provider";
import {
  addFarmerStatus,
  checkFarmerStatus,
  voteFarmerStatus,
  type FarmerStatusColor,
  type FarmerStatusRecord,
} from "@/lib/api/farmer-status";

type FarmerStatusForm = {
  farmerName: string;
  aadhaar: string;
  mobileNumber: string;
  district: string;
  mandal: string;
  village: string;
  rationCardAddress: string;
  remarks: string;
};

const initialFarmerStatusForm: FarmerStatusForm = {
  farmerName: "",
  aadhaar: "",
  mobileNumber: "",
  district: "",
  mandal: "",
  village: "",
  rationCardAddress: "",
  remarks: "",
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

const statusOptions: Array<{
  value: FarmerStatusColor;
  label: string;
  helper: string;
}> = [
  { value: "GREEN", label: "GREEN", helper: "Regular credit pattern" },
  { value: "YELLOW", label: "YELLOW", helper: "Delayed repayment pattern" },
  { value: "RED", label: "RED", helper: "High-risk repayment pattern" },
];

function maskAadhaar(value: string) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length >= 4 ? `XXXX XXXX ${digits.slice(-4)}` : "XXXX XXXX XXXX";
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

const buildAutocompleteLabel = (place: GooglePlace) => place.formatted_address || place.name || "";

const formatMandalSuggestion = (mandal: {
  districtName: string;
  mandalName: string;
  stateName: string;
}) => `${mandal.mandalName} mandal, ${mandal.districtName} district, ${mandal.stateName}`;

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

export default function AddFarmerStatusPage() {
  const { language } = useKyfiLanguage();
  const isTe = language === "te";
  const farmerNameInputRef = useRef<HTMLInputElement | null>(null);
  const aadhaarInputRef = useRef<HTMLInputElement | null>(null);
  const mobileInputRef = useRef<HTMLInputElement | null>(null);
  const districtInputRef = useRef<HTMLInputElement | null>(null);
  const villageInputRef = useRef<HTMLInputElement | null>(null);
  const districtAutocompleteRef = useRef<any>(null);
  const villageAutocompleteRef = useRef<any>(null);
  const mandalInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<FarmerStatusColor>("GREEN");
  const [form, setForm] = useState<FarmerStatusForm>(initialFarmerStatusForm);
  const [fieldErrors, setFieldErrors] = useState({
    farmerName: "",
    aadhaar: "",
    mobileNumber: "",
    district: "",
    mandal: "",
    village: "",
  });
  const [existingFarmer, setExistingFarmer] = useState<FarmerStatusRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
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

  useEffect(() => {
    if (!toast.open) return;

    const timeout = window.setTimeout(() => {
      setToast((current) => ({ ...current, open: false }));
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [toast.open]);

  const showToast = (message: string, tone: "success" | "error" = "success") => {
    setToast({ open: true, message, tone });
  };

  const handleChange =
    (field: keyof FarmerStatusForm) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value =
        field === "aadhaar" || field === "mobileNumber"
          ? event.target.value.replace(/\D/g, "")
          : event.target.value;

      setForm((current) => {
        if (field === "district") {
          return { ...current, district: value, mandal: "" };
        }

        if (field === "mandal") {
          return { ...current, mandal: value };
        }

        return { ...current, [field]: value };
      });

      if (field === "district") {
        setHideMandalSuggestions(false);
        setMandalOptions([]);
      }
      if (field === "mandal") {
        setHideMandalSuggestions(false);
      }
      setError("");
      setMessage("");
      if (field === "farmerName" || field === "aadhaar" || field === "mobileNumber" || field === "district" || field === "mandal" || field === "village") {
        setFieldErrors((current) => ({ ...current, [field]: "" }));
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
      fetch(`${process.env.NEXT_PUBLIC_KYFI_API_BASE_URL}/locations/mandals?district=${encodeURIComponent(districtName)}&query=${encodeURIComponent(mandalQuery)}`)
        .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
        .then(({ ok, data }) => {
          if (isCancelled) return;
          if (!ok) {
            setMandalOptions([]);
            setMandalSearchLoading(false);
            return;
          }
          setMandalOptions(Array.isArray(data?.mandals) ? data.mandals : []);
          setMandalSearchLoading(false);
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

  const lookupExisting = async () => {
    const aadhaar = form.aadhaar.replace(/\s+/g, "").trim();
    const mobileNumber = form.mobileNumber.trim();

    if (!aadhaar && !mobileNumber) {
      setError(isTe ? "ఉన్న రికార్డును తనిఖీ చేయడానికి Aadhaar లేదా mobile number నమోదు చేయండి." : "Enter Aadhaar or mobile number to check an existing record.");
      return null;
    }

    setIsChecking(true);

    try {
      const response = await checkFarmerStatus({ aadhaar, mobileNumber });
      if (response.exists && response.farmerStatus) {
        setExistingFarmer(response.farmerStatus);
        setModalOpen(true);
        showToast(isTe ? "ఇప్పటికే ఉన్న రైతు రికార్డు కనుగొనబడింది." : "Existing farmer record found.");
        setMessage(isTe ? "ఇప్పటికే ఉన్న రైతు రికార్డు కనుగొనబడింది." : "Existing farmer record found.");
        return response.farmerStatus;
      }

      setExistingFarmer(null);
      setMessage(isTe ? "ఉన్న రైతు రికార్డు కనబడలేదు." : "No existing farmer record found.");
      return null;
    } catch (checkError) {
      setError(checkError instanceof Error ? checkError.message : isTe ? "తనిఖీ విఫలమైంది" : "Check failed");
      return null;
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setFieldErrors({
      farmerName: "",
      aadhaar: "",
      mobileNumber: "",
      district: "",
      mandal: "",
      village: "",
    });

    const aadhaar = form.aadhaar.replace(/\s+/g, "").trim();
    const mobileNumber = form.mobileNumber.trim();

    const nextErrors = {
      farmerName: form.farmerName.trim() ? "" : (isTe ? "రైతు పేరు అవసరం." : "Farmer name is required."),
      aadhaar: /^\d{12}$/.test(aadhaar)
        ? ""
        : (isTe ? "సరైన 12 అంకెల Aadhaar సంఖ్యను నమోదు చేయండి." : "Enter a valid 12-digit Aadhaar number."),
      mobileNumber:
        !mobileNumber || /^[6-9]\d{9}$/.test(mobileNumber)
          ? ""
          : (isTe ? "సరైన 10 అంకెల mobile number ను నమోదు చేయండి." : "Enter a valid 10-digit mobile number."),
      district: form.district.trim() ? "" : (isTe ? "జిల్లా అవసరం." : "District is required."),
      mandal: form.mandal.trim() ? "" : (isTe ? "మండలం అవసరం." : "Mandal is required."),
      village: form.village.trim() ? "" : (isTe ? "గ్రామం అవసరం." : "Village is required."),
    };

    setFieldErrors(nextErrors);

    const firstInvalidField = Object.entries(nextErrors).find(([, value]) => Boolean(value))?.[0];
    if (firstInvalidField) {
      if (firstInvalidField === "farmerName") farmerNameInputRef.current?.focus();
      if (firstInvalidField === "aadhaar") aadhaarInputRef.current?.focus();
      if (firstInvalidField === "mobileNumber") mobileInputRef.current?.focus();
      if (firstInvalidField === "district") districtInputRef.current?.focus();
      if (firstInvalidField === "mandal") mandalInputRef.current?.focus();
      if (firstInvalidField === "village") villageInputRef.current?.focus();
      return;
    }

    if (!aadhaar || aadhaar.length !== 12) {
      setError(isTe ? "సరైన 12 అంకెల Aadhaar సంఖ్యను నమోదు చేయండి." : "Enter a valid 12-digit Aadhaar number.");
      return;
    }

    if (mobileNumber && !/^[6-9]\d{9}$/.test(mobileNumber)) {
      setError(isTe ? "సరైన 10 అంకెల mobile number ను నమోదు చేయండి." : "Enter a valid 10-digit mobile number.");
      return;
    }

    if (
      !form.farmerName.trim() ||
      !form.district.trim() ||
      !form.mandal.trim() ||
      !form.village.trim()
    ) {
      setError(isTe ? "రైతు పేరు, జిల్లా, మండలం, మరియు గ్రామం అవసరం." : "Farmer name, district, mandal, and village are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const existing = await lookupExisting();

      if (existing) {
        return;
      }

      const response = await addFarmerStatus({
        aadhaar,
        farmerName: form.farmerName.trim(),
        mobileNumber: mobileNumber || undefined,
        district: form.district.trim(),
        mandal: form.mandal.trim(),
        village: form.village.trim(),
        statusColor: selectedStatus,
        rationCardNumber: form.rationCardAddress.trim() || undefined,
        address: form.rationCardAddress.trim() || undefined,
        remarks: form.remarks.trim() || undefined,
      });

      setExistingFarmer(null);
      setModalOpen(false);
      setForm(initialFarmerStatusForm);
      setSelectedStatus("GREEN");
      setHideMandalSuggestions(false);
      setMandalOptions([]);
      setFieldErrors({
        farmerName: "",
        aadhaar: "",
        mobileNumber: "",
        district: "",
        mandal: "",
        village: "",
      });
      showToast(isTe ? "రైతు status జోడించబడింది" : "Farmer status added");
      setMessage(isTe ? "రైతు status జోడించబడింది" : "Farmer status added");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : isTe ? "సేవ్ విఫలమైంది" : "Save failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async () => {
    if (!existingFarmer) return;

    setIsVoting(true);
    setError("");

    try {
      const response = await voteFarmerStatus(existingFarmer.id);
      if (response.farmerStatus) {
        setExistingFarmer(response.farmerStatus);
      }
      showToast(response.message);
      setMessage(response.message);
    } catch (voteError) {
      setError(voteError instanceof Error ? voteError.message : isTe ? "ఓటు విఫలమైంది" : "Vote failed");
    } finally {
      setIsVoting(false);
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
          <p className="font-manrope type-small uppercase tracking-[0.2em] text-emerald-700">
            {isTe ? "డీలర్‌లకు మాత్రమే రికార్డు నమోదు" : "Dealer-only record entry"}
          </p>
          <h1 className="mt-3 font-manrope type-section text-slate-900">
            {isTe ? "రైతు status జోడించండి" : "Add Farmer Status"}
          </h1>
          <p className="mt-4 font-manrope type-body">
            {isTe
              ? "Aadhaar ను ప్రధాన గుర్తింపుగా ఉపయోగించి సాధారణ రైతు రేప్యుటేషన్ రికార్డును సృష్టించండి. ఈ స్క్రీన్ blacklist కోసం కాదు."
              : "Create a general farmer reputation record using Aadhaar as the primary identifier. This screen is not for blacklist entries."}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          <Card className="overflow-hidden border-white/80 bg-white/85 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <CardContent className="space-y-8 p-6 sm:p-8">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-manrope type-nav text-slate-900">{isTe ? "రైతు status ఫారం" : "Farmer status form"}</p>
                    <p className="mt-1 font-manrope type-body">
                      {isTe ? "ఇక్కడ PAN అవసరం లేదు. Aadhaar, mobile, mandal, మరియు village వాడండి." : "PAN is not required here. Use Aadhaar, mobile, mandal, and village."}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="rounded-full border-emerald-200 bg-emerald-50 px-4 py-1 text-[0.95rem] font-extrabold tracking-[0.12em] text-emerald-900 shadow-none"
                  >
                    {isTe ? "సాధారణ status మాత్రమే" : "GENERAL STATUS ONLY"}
                  </Badge>
                </div>

                <Alert className="rounded-[28px] border-emerald-200 bg-emerald-50/55 px-5 py-5 text-slate-500">
                  {isTe
                    ? "Blacklist status నుండి వేరు. ఈ ఫారం GREEN, YELLOW, లేదా RED reputation records మాత్రమే సృష్టిస్తుంది."
                    : "Blacklist is separate from status. This form creates only GREEN, YELLOW, or RED reputation records."}
                </Alert>

                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                      <label className="font-manrope type-nav text-slate-800">{isTe ? "రైతు పేరు" : "Farmer name"} <span className="text-red-500">*</span></label>
                      <Input
                        ref={farmerNameInputRef}
                        placeholder={isTe ? "రైతు పేరును నమోదు చేయండి" : "Enter farmer name"}
                        value={form.farmerName}
                        onChange={handleChange("farmerName")}
                        required
                        aria-invalid={Boolean(fieldErrors.farmerName)}
                        className={fieldErrors.farmerName ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-100" : ""}
                      />
                      {fieldErrors.farmerName ? <p className="font-manrope text-sm text-red-600">{fieldErrors.farmerName}</p> : null}
                    </div>

                    <div className="space-y-2">
                      <label className="font-manrope type-nav text-slate-800">{isTe ? "Aadhaar సంఖ్య" : "Aadhaar number"} <span className="text-red-500">*</span></label>
                      <Input
                        ref={aadhaarInputRef}
                        placeholder="XXXX XXXX 1234"
                        type="text"
                        inputMode="numeric"
                        maxLength={12}
                        pattern="[0-9]{12}"
                        autoComplete="off"
                        value={form.aadhaar}
                        onChange={handleChange("aadhaar")}
                        required
                        aria-invalid={Boolean(fieldErrors.aadhaar)}
                        className={fieldErrors.aadhaar ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-100" : ""}
                      />
                      <p className="font-manrope type-small text-slate-500">
                        {isTe ? "కేవలం 12 అంకెలు మాత్రమే. స్పేస్‌లు అవసరం లేదు." : "Enter only 12 digits. Spaces are not needed."}
                      </p>
                      {fieldErrors.aadhaar ? <p className="font-manrope text-sm text-red-600">{fieldErrors.aadhaar}</p> : null}
                    </div>

                    <div className="space-y-2">
                      <label className="font-manrope type-nav text-slate-800">{isTe ? "Mobile number" : "Mobile number"} <span className="text-red-500">*</span></label>
                      <Input
                        placeholder={isTe ? "Mobile number నమోదు చేయండి" : "Enter mobile number"}
                        inputMode="tel"
                        maxLength={10}
                        value={form.mobileNumber}
                        onChange={handleChange("mobileNumber")}
                        ref={mobileInputRef}
                        aria-invalid={Boolean(fieldErrors.mobileNumber)}
                        className={fieldErrors.mobileNumber ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-100" : ""}
                      />
                      {fieldErrors.mobileNumber ? <p className="font-manrope text-sm text-red-600">{fieldErrors.mobileNumber}</p> : null}
                    </div>

                    <div className="space-y-2">
                      <label className="font-manrope type-nav text-slate-800">{isTe ? "జిల్లా" : "District"} <span className="text-red-500">*</span></label>
                    <Input
                      ref={districtInputRef}
                      placeholder={isTe ? "జిల్లాను నమోదు చేయండి" : "Enter district"}
                      value={form.district}
                      onChange={handleChange("district")}
                      required
                      aria-invalid={Boolean(fieldErrors.district)}
                      className={fieldErrors.district ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-100" : ""}
                    />
                    {fieldErrors.district ? <p className="font-manrope text-sm text-red-600">{fieldErrors.district}</p> : null}
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
                        onChange={handleChange("mandal")}
                        disabled={!form.district.trim()}
                        required
                        aria-invalid={Boolean(fieldErrors.mandal)}
                        className={fieldErrors.mandal ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-100" : ""}
                      />
                      {form.district.trim() &&
                      form.mandal.trim().length >= 2 &&
                      !hideMandalSuggestions ? (
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
                      {fieldErrors.mandal ? <p className="font-manrope text-sm text-red-600">{fieldErrors.mandal}</p> : null}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="font-manrope type-nav text-slate-800">{isTe ? "గ్రామం" : "Village"} <span className="text-red-500">*</span></label>
                    <Input
                      ref={villageInputRef}
                      placeholder={isTe ? "గ్రామాన్ని నమోదు చేయండి" : "Enter village"}
                      value={form.village}
                      onChange={handleChange("village")}
                      required
                      aria-invalid={Boolean(fieldErrors.village)}
                      className={fieldErrors.village ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-100" : ""}
                    />
                    {fieldErrors.village ? <p className="font-manrope text-sm text-red-600">{fieldErrors.village}</p> : null}
                  </div>

                    <div className="space-y-2 md:col-span-2 lg:col-span-3">
                      <label className="font-manrope type-nav text-slate-800">
                        {isTe ? <>రేషన్ కార్డు / చిరునామా <span className="text-slate-400">(ఐచ్ఛికం)</span></> : <>Ration card / address <span className="text-slate-400">(optional)</span></>}
                      </label>
                      <Input
                        placeholder={isTe ? "ఐచ్ఛిక చిరునామా లేదా ration card సూచన" : "Optional address or ration card reference"}
                        value={form.rationCardAddress}
                        onChange={handleChange("rationCardAddress")}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2 lg:col-span-3">
                      <label className="font-manrope type-nav text-slate-800">
                        {isTe ? <>గమనికలు <span className="text-slate-400">(ఐచ్ఛికం)</span></> : <>Remarks <span className="text-slate-400">(optional)</span></>}
                      </label>
                      <textarea
                        placeholder={isTe ? "చెల్లింపు విధానం లేదా సీజన్ గురించి చిన్న గమనికలు జోడించండి" : "Add short notes about repayment pattern or season"}
                        value={form.remarks}
                        onChange={handleChange("remarks")}
                        className="min-h-[120px] w-full rounded-xl border border-input bg-background px-4 py-3 font-manrope type-body text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-3">
                      {statusOptions.map((option) => (
                        (() => {
                          const isSelected = selectedStatus === option.value;
                          const activeStyles =
                            option.value === "GREEN"
                              ? "border-emerald-300 bg-emerald-50/90 text-emerald-950 shadow-[0_12px_30px_rgba(16,185,129,0.12)]"
                              : option.value === "YELLOW"
                                ? "border-amber-300 bg-amber-50/90 text-amber-950 shadow-[0_12px_30px_rgba(245,158,11,0.12)]"
                                : "border-red-300 bg-red-50/90 text-red-950 shadow-[0_12px_30px_rgba(239,68,68,0.12)]";

                          const inactiveStyles = "border-border bg-slate-50 text-slate-700 hover:bg-slate-100";
                          const selectedHelper =
                            option.value === "GREEN"
                              ? "!text-emerald-700"
                              : option.value === "YELLOW"
                                ? "!text-amber-700"
                                : "!text-red-700";

                          return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setSelectedStatus(option.value)}
                            className={[
                              "rounded-2xl border px-4 py-4 text-left transition duration-200",
                              isSelected ? activeStyles : inactiveStyles,
                            ].join(" ")}
                          >
                            <p
                              className={[
                                "font-manrope type-card font-semibold",
                                isSelected
                                  ? option.value === "GREEN"
                                    ? "!text-emerald-700"
                                    : option.value === "YELLOW"
                                      ? "!text-amber-700"
                                      : "!text-red-700"
                                  : "!text-slate-900",
                              ].join(" ")}
                            >
                              {option.label}
                            </p>
                            <p
                              className={[
                                "mt-1 font-manrope type-small",
                                isSelected ? selectedHelper : "text-slate-500",
                              ].join(" ")}
                            >
                              {option.helper}
                            </p>
                          </button>
                          );
                        })()
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      className="w-full !bg-[rgb(4,120,87)] !text-white hover:!bg-[rgb(4,120,87)] hover:brightness-105 sm:w-auto sm:min-w-[280px] lg:min-w-[320px]"
                      size="lg"
                      type="submit"
                      disabled={isSubmitting || isChecking}
                    >
                    {isSubmitting ? (isTe ? "సేవ్ చేస్తోంది..." : "Saving...") : (isTe ? "రైతు status జోడించండి" : "Add farmer status")}
                    </Button>
                  </div>

                  {error ? <p className="font-manrope type-small text-red-600">{error}</p> : null}
                  {message ? <p className="font-manrope type-small text-emerald-700">{message}</p> : null}
                </form>

                <div className="space-y-5 border-t border-slate-200 pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-manrope type-small uppercase tracking-[0.2em] text-[rgb(4,120,87)]">
                        {isTe ? "సహాయం" : "Help"}
                      </p>
                      <h2 className="mt-1 font-manrope type-card text-slate-900">
                        {isTe ? "సులభమైన రికార్డు నమోదు నియమాలు" : "Simple record entry rules"}
                      </h2>
                    </div>
                  </div>
                  <p className="font-manrope type-body leading-7 text-slate-600">
                    {isTe ? "ఇక్కడ PAN అవసరం లేదు. Aadhaar, mobile, mandal, మరియు village వాడండి." : "PAN is not required here. Use Aadhaar, mobile, mandal, and village."}
                  </p>
                  <ul className="space-y-3 border-t border-slate-100 pt-4 font-manrope type-body text-slate-600">
                    <li className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[rgb(4,120,87)]" />
                      <span>{isTe ? "పాటర్న్‌ను నిర్ధారించడానికి ఇతర డీలర్లు ఒక్కసారి ఓటు వేయగలరు." : "Other dealers can vote once to confirm the pattern."}</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[rgb(4,120,87)]" />
                      <span>{isTe ? "Admin తప్పు లేదా వివాదాస్పద రికార్డులను తొలగించగలరు." : "Admin can remove false or disputed records."}</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[rgb(4,120,87)]" />
                      <span>{isTe ? "Blacklist GREEN, YELLOW, మరియు RED status నుండి వేరు గా ఉంటుంది." : "Blacklist stays separate from GREEN, YELLOW, and RED status."}</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[rgb(4,120,87)]" />
                      <span>{isTe ? "Duplicate records Aadhaar ద్వారా నిరోధించబడతాయి." : "Duplicate records are blocked by Aadhaar."}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      <KyfiToast
        open={toast.open}
        message={toast.message}
        tone={toast.tone}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
      />

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-white/70 bg-white p-6 shadow-[0_24px_90px_rgba(15,23,42,0.2)] sm:p-8">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="font-manrope type-nav text-slate-900">
                  {existingFarmer ? (isTe ? "ఇప్పటికే ఉన్న రైతు status" : "Existing farmer status") : (isTe ? "రైతు status" : "Farmer status")}
                </p>
                <p className="mt-1 font-manrope type-body text-slate-600">
                  {existingFarmer
                    ? (isTe ? "ఈ రైతు ఇప్పటికే ఉన్నాడు. రికార్డును సమీక్షించి అవసరమైతే ఓటు వేయండి." : "This farmer already exists. Review the record and vote if needed.")
                    : (isTe ? "కొత్తగా జోడించిన రైతు status రికార్డు." : "A newly added farmer status record.")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                aria-label={isTe ? "మోడల్ మూసివేయండి" : "Close modal"}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Info label={isTe ? "రైతు" : "Farmer"} value={existingFarmer?.farmerName || form.farmerName || "Suresh Reddy"} />
              <Info
                label={isTe ? "స్థితి" : "Status"}
                value={existingFarmer?.statusColor || selectedStatus}
                badge={
                  <Badge
                    variant={
                      (existingFarmer?.statusColor || selectedStatus) === "GREEN"
                        ? "success"
                        : (existingFarmer?.statusColor || selectedStatus) === "YELLOW"
                          ? "warning"
                          : "destructive"
                    }
                  >
                    {existingFarmer?.statusColor || selectedStatus}
                  </Badge>
                }
              />
              <Info label={isTe ? "Aadhaar" : "Aadhaar"} value={existingFarmer?.aadhaarMasked || maskAadhaar(form.aadhaar)} />
              <Info label={isTe ? "Mobile" : "Mobile"} value={existingFarmer?.mobileNumber || form.mobileNumber || (isTe ? "ఇవ్వలేదు" : "Not provided")} />
              <Info
                label={isTe ? "ప్రాంతం" : "Location"}
                value={
                  existingFarmer
                    ? `${existingFarmer.village}, ${existingFarmer.mandal}, ${existingFarmer.district}`
                    : `${form.village || (isTe ? "గ్రామం" : "Village")}, ${form.mandal || (isTe ? "మండలం" : "Mandal")}, ${form.district || (isTe ? "జిల్లా" : "District")}`
                }
              />
              <Info label={isTe ? "ఓట్లు" : "Votes"} value={String(existingFarmer?.voteCount ?? 0)} />
            </div>

            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="font-manrope type-body text-amber-900">
                {existingFarmer
                  ? existingFarmer.currentDealerVoted
                    ? (isTe ? "మీరు ఇప్పటికే ఈ రైతు status పై ఓటు వేశారు." : "You already voted on this farmer status.")
                    : (isTe ? "ఈ రైతు status మరో డీలర్ నుండి ఇప్పటికే ఉంది. పాటర్న్‌ను నిర్ధారించడానికి ఒక్కసారి ఓటు వేయవచ్చు." : "This farmer status already exists from another dealer. You can vote once to confirm the pattern.")
                  : (isTe ? "ఈ రికార్డు విజయవంతంగా సృష్టించబడింది." : "This record was created successfully.")}
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              {existingFarmer && existingFarmer.canVote ? (
                <Button onClick={() => void handleVote()} disabled={isVoting}>
                  {isVoting ? (isTe ? "ఓటు వేస్తోంది..." : "Voting...") : (isTe ? "ఒక్కసారి ఓటు వేయండి" : "Vote once")}
                </Button>
              ) : null}
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                {isTe ? "మూసివేయండి" : "Close"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <Footer />
    </main>
  );
}

function Info({
  label,
  value,
  badge,
}: {
  label: string;
  value: string;
  badge?: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="font-manrope type-small text-slate-500">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        {badge}
        <p className="font-manrope type-nav text-slate-900">{value}</p>
      </div>
    </div>
  );
}




