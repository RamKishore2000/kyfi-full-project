"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { CalendarDays, CreditCard, X } from "lucide-react";
import { Footer } from "@/components/kyfi/footer";
import { AuthGuard } from "@/components/kyfi/auth-guard";
import { Header } from "@/components/kyfi/header";
import { AppBackButton } from "@/components/kyfi/app-back-button";
import { KyfiToast } from "@/components/kyfi/kyfi-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchCurrentDealer, updateCurrentDealerProfile } from "@/lib/api/profile";
import type { DealerAuthResponse } from "@/lib/api/auth";
import {
  createMandal,
  createVillage,
  fetchMandals,
  fetchVillagesByMandal,
  searchDistricts,
  searchVillages,
  type DistrictSearchResult,
  type MandalRecord,
  type VillageSearchResult,
} from "@/lib/api/locations";
import { useKyfiLanguage } from "@/components/kyfi/language-provider";
import { translateRuntimeMessage } from "@/lib/kyfi-runtime-message";

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

const formatProfileDate = (value?: string | null) => {
  if (!value) return "-";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
};

const formatProfilePrice = (value?: number | null) => {
  if (value === undefined || value === null) return "-";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value));
};

const getRemainingDays = (value?: string | null) => {
  if (!value) return "-";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";

  const diff = parsed.getTime() - Date.now();
  if (diff <= 0) return "0";

  return String(Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

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
  const districtDropdownRef = useRef<HTMLDivElement | null>(null);
  const villageDropdownRef = useRef<HTMLDivElement | null>(null);
  const stateAutocompleteRef = useRef<any>(null);
  const districtAutocompleteRef = useRef<any>(null);
  const villageAutocompleteRef = useRef<any>(null);
  const [mandalModalOpen, setMandalModalOpen] = useState(false);
  const [villageModalOpen, setVillageModalOpen] = useState(false);
  const [districtQuery, setDistrictQuery] = useState("");
  const [districtOptions, setDistrictOptions] = useState<DistrictSearchResult[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictSearchResult | null>(null);
  const [districtLoading, setDistrictLoading] = useState(false);
  const [showDistrictSuggestions, setShowDistrictSuggestions] = useState(false);
  const [districtSearchLoading, setDistrictSearchLoading] = useState(false);
  const [showModalDistrictOptions, setShowModalDistrictOptions] =
    useState(false);
  const [mandalModalName, setMandalModalName] = useState("");
  const [mandalModalSaving, setMandalModalSaving] = useState(false);
  const [villageModalName, setVillageModalName] = useState("");
  const [villageModalSaving, setVillageModalSaving] = useState(false);
  const [modalError, setModalError] = useState("");
  const [form, setForm] = useState({
    name: "",
    shopName: "",
    mobile: "",
    district: "",
    state: "",
    mandal: "",
    village: "",
  });
  const [dealerProfile, setDealerProfile] = useState<DealerAuthResponse | null>(null);
  const [mandalOptions, setMandalOptions] = useState<MandalRecord[]>([]);
  const [hideMandalSuggestions, setHideMandalSuggestions] = useState(false);
  const [mandalSearchLoading, setMandalSearchLoading] = useState(false);
  const [selectedMandal, setSelectedMandal] = useState<MandalRecord | null>(null);
  const [selectedVillage, setSelectedVillage] =
    useState<VillageSearchResult | null>(null);
  const [showMandalSuggestions, setShowMandalSuggestions] = useState(false);
  const [villageOptions, setVillageOptions] = useState<VillageSearchResult[]>([]);
  const [villageLoading, setVillageLoading] = useState(false);
  const [showVillageSuggestions, setShowVillageSuggestions] = useState(false);
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
        setDealerProfile(dealer);

        setForm({
          name: dealer.name ?? "",
          shopName: dealer.shopName ?? "",
          mobile: dealer.mobile ?? "",
          district: dealer.district ?? "",
          state: dealer.state ?? "",
          mandal: dealer.mandal ?? "",
          village: dealer.village ?? "",
        });
        setSelectedDistrict(null);
        setSelectedMandal(null);
        setSelectedVillage(null);
        setShowDistrictSuggestions(false);
        setShowMandalSuggestions(false);
        setShowVillageSuggestions(false);
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
    const query = form.district.trim();

    if (!showDistrictSuggestions || query.length < 2) {
      setDistrictOptions([]);
      setDistrictLoading(false);
      return;
    }

    let isCancelled = false;
    setDistrictLoading(true);
    const debounce = window.setTimeout(() => {
      searchDistricts(query)
        .then((items) => {
          if (isCancelled) return;
          setDistrictOptions(items);
          setDistrictLoading(false);
        })
        .catch(() => {
          if (!isCancelled) {
            setDistrictOptions([]);
            setDistrictLoading(false);
          }
        });
    }, 200);

    return () => {
      isCancelled = true;
      window.clearTimeout(debounce);
    };
  }, [form.district, showDistrictSuggestions]);

  useEffect(() => {
    const districtName = selectedDistrict?.name || form.district.trim();
    const mandalQuery = form.mandal.trim();

    if (
      hideMandalSuggestions ||
      !districtName ||
      mandalQuery.length < 3 ||
      !showMandalSuggestions
    ) {
      setMandalOptions([]);
      setMandalSearchLoading(false);
      return;
    }

    let isCancelled = false;
    setMandalSearchLoading(true);

    const debounce = window.setTimeout(() => {
      fetchMandals({
        district: districtName,
        query: mandalQuery,
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
  }, [form.district, form.mandal, hideMandalSuggestions, selectedDistrict, showMandalSuggestions]);

  useEffect(() => {
    const mandalId = Number(selectedMandal?.id || 0);
    const villageQuery = form.village.trim();

    if (!mandalId || !showVillageSuggestions) {
      setVillageOptions([]);
      setVillageLoading(false);
      return;
    }

    let isCancelled = false;
    setVillageLoading(true);
    const debounce = window.setTimeout(() => {
      const request = villageQuery
        ? searchVillages({ mandalId, query: villageQuery })
        : fetchVillagesByMandal(mandalId);

      request
        .then((items) => {
          if (isCancelled) return;
          setVillageOptions(items);
          setVillageLoading(false);
        })
        .catch(() => {
          if (!isCancelled) {
            setVillageOptions([]);
            setVillageLoading(false);
          }
        });
    }, villageQuery ? 220 : 0);

    return () => {
      isCancelled = true;
      window.clearTimeout(debounce);
    };
  }, [form.village, selectedMandal, showVillageSuggestions]);

  useEffect(() => {
    if (!mandalModalOpen) {
      setDistrictOptions([]);
      setDistrictSearchLoading(false);
      return;
    }

    const query = districtQuery.trim();
    if (!showModalDistrictOptions || query.length < 2) {
      setDistrictOptions([]);
      setDistrictSearchLoading(false);
      return;
    }

    let isCancelled = false;
    setDistrictSearchLoading(true);

    const debounce = window.setTimeout(() => {
      searchDistricts(query)
        .then((results) => {
          if (!isCancelled) {
            setDistrictOptions(results);
            setDistrictSearchLoading(false);
          }
        })
        .catch(() => {
          if (!isCancelled) {
            setDistrictOptions([]);
            setDistrictSearchLoading(false);
          }
        });
    }, 200);

    return () => {
      isCancelled = true;
      window.clearTimeout(debounce);
    };
  }, [districtQuery, mandalModalOpen, showModalDistrictOptions]);

  const handleChange = (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    setForm((current) => {
      if (field === "state") {
        return { ...current, state: value, district: "", mandal: "", village: "" };
      }

      if (field === "district") {
        return { ...current, district: value, mandal: "", village: "" };
      }

      if (field === "mandal") {
        return { ...current, mandal: value, village: "" };
      }

      return { ...current, [field]: value };
    });

    if (field === "district") {
      setSelectedDistrict(null);
      setSelectedMandal(null);
      setSelectedVillage(null);
      setShowDistrictSuggestions(true);
      setShowMandalSuggestions(false);
      setShowVillageSuggestions(false);
      setDistrictOptions([]);
      setMandalOptions([]);
      setVillageOptions([]);
      setHideMandalSuggestions(false);
    }

    if (field === "mandal") {
      setSelectedMandal(null);
      setSelectedVillage(null);
      setHideMandalSuggestions(false);
      setShowMandalSuggestions(true);
      setShowVillageSuggestions(false);
      setVillageOptions([]);
    }

    if (field === "village") {
      setSelectedVillage(null);
      setShowVillageSuggestions(true);
    }

    setError("");
  };

  const openMandalModal = () => {
    setModalError("");
    setDistrictQuery(form.district.trim());
    setSelectedDistrict(
      districtOptions.find((district) => district.name.trim().toLowerCase() === form.district.trim().toLowerCase()) ?? null,
    );
    setDistrictOptions([]);
    setShowModalDistrictOptions(false);
    setMandalModalName("");
    setMandalModalOpen(true);
  };

  const openVillageModal = () => {
    if (!selectedMandal && !form.mandal.trim()) {
      setModalError(t("profile.noMandal"));
      showToast(t("profile.noMandal"), "error");
      return;
    }

    setModalError("");
    setVillageModalName("");
    setVillageModalOpen(true);
  };

  const closeMandalModal = () => {
    setMandalModalOpen(false);
    setDistrictOptions([]);
    setDistrictSearchLoading(false);
    setShowModalDistrictOptions(false);
    setDistrictQuery("");
    setSelectedDistrict(null);
    setMandalModalName("");
    setModalError("");
  };

  const closeVillageModal = () => {
    setVillageModalOpen(false);
    setVillageModalName("");
    setModalError("");
  };

  const handleCreateMandal = async () => {
    const trimmedName = mandalModalName.trim();
    const district = selectedDistrict ?? districtOptions[0] ?? null;

    if (!district) {
      setModalError("Select a district first.");
      return;
    }

    if (!trimmedName) {
      setModalError("Enter mandal name.");
      return;
    }

    setMandalModalSaving(true);
    setModalError("");

    try {
      const response = await createMandal({
        districtId: district.id,
        mandalName: trimmedName,
      });

      const mandal = response.mandal;
      setForm((current) => ({
        ...current,
        district: mandal?.districtName ?? district.name,
        state: mandal?.stateName ?? current.state,
        mandal: mandal?.name ?? trimmedName,
        village: "",
      }));
      setHideMandalSuggestions(true);
      setMandalOptions([]);
      closeMandalModal();
      showToast(
        response.message ? translateRuntimeMessage(response.message) : "Mandal added successfully.",
      );
    } catch (createError) {
      const nextError =
        createError instanceof Error
          ? translateRuntimeMessage(createError.message)
          : "Unable to add mandal.";
      setModalError(nextError);
      showToast(nextError, "error");
    } finally {
      setMandalModalSaving(false);
    }
  };

  const handleCreateVillage = async () => {
    const trimmedName = villageModalName.trim();
    const currentMandalName = form.mandal.trim();

    if (!currentMandalName) {
      setModalError("Select a mandal first.");
      return;
    }

    if (!trimmedName) {
      setModalError("Enter village name.");
      return;
    }

    setVillageModalSaving(true);
    setModalError("");

    try {
      let mandalMatch = mandalOptions.find(
        (entry) => entry.mandalName.trim().toLowerCase() === currentMandalName.toLowerCase(),
      );

      if (!mandalMatch) {
        const response = await fetchMandals({
          state: form.state.trim(),
          district: form.district.trim(),
          query: currentMandalName,
        });

        mandalMatch = response.mandals.find(
          (entry) => entry.mandalName.trim().toLowerCase() === currentMandalName.toLowerCase(),
        );
      }

      if (!mandalMatch) {
        throw new Error("Select a valid mandal first.");
      }

      const response = await createVillage({
        mandalId: mandalMatch.id,
        villageName: trimmedName,
      });

      const village = response.village;
      setForm((current) => ({
        ...current,
        village: village?.name ?? trimmedName,
      }));
      closeVillageModal();
      showToast(
        response.message ? translateRuntimeMessage(response.message) : "Village added successfully.",
      );
    } catch (createError) {
      const nextError =
        createError instanceof Error
          ? translateRuntimeMessage(createError.message)
          : "Unable to add village.";
      setModalError(nextError);
      showToast(nextError, "error");
    } finally {
      setVillageModalSaving(false);
    }
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
      setDealerProfile(dealer);
      setForm({
        name: dealer.name ?? "",
        shopName: dealer.shopName ?? "",
        mobile: dealer.mobile ?? "",
        district: dealer.district ?? "",
        state: dealer.state ?? "",
        mandal: dealer.mandal ?? "",
        village: dealer.village ?? "",
      });
      const successMessage = response.message
        ? translateRuntimeMessage(response.message)
        : t("profile.updated");
      showToast(successMessage);
    } catch (submitError) {
      const nextError =
        submitError instanceof Error
          ? translateRuntimeMessage(submitError.message)
          : t("profile.updateFailed");
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
        <AppBackButton />

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-3xl">
            <p className="font-manrope type-small uppercase tracking-[0.2em] text-emerald-700">
              <span className="hidden kyfi-native-inline">Dealer account</span>
              <span className="kyfi-browser-inline">{t("profile.title")}</span>
            </p>
            <h1 className="mt-3 font-manrope type-section text-slate-900">
              <span className="hidden kyfi-native-inline">My Profile</span>
              <span className="kyfi-browser-inline">{t("profile.title")}</span>
            </h1>
            <p className="mt-4 font-manrope type-body text-slate-600">
              <span className="hidden kyfi-native-inline">
                Keep your contact and location details up to date.
              </span>
              <span className="kyfi-browser-inline">{t("profile.onlyApproved")}</span>
            </p>
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

          <Card className="mb-6 overflow-hidden border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-white shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-manrope type-small uppercase tracking-[0.2em] text-emerald-700">
                    {t("profile.subscriptionKicker")}
                  </p>
                  <h2 className="mt-2 font-manrope type-card text-slate-950">
                    {t("profile.subscriptionTitle")}
                  </h2>
                </div>
                <Badge
                  className={
                    dealerProfile?.subscriptionStatus === "active"
                      ? "w-fit border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "w-fit border-amber-200 bg-amber-50 text-amber-700"
                  }
                  variant="outline"
                >
                  {dealerProfile?.subscriptionStatus === "active"
                    ? t("profile.subscriptionActive")
                    : t("profile.subscriptionInactive")}
                </Badge>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4">
                  <p className="font-manrope text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    {t("profile.subscriptionPlan")}
                  </p>
                  <p className="mt-2 font-manrope text-base font-extrabold text-slate-950">
                    {dealerProfile?.subscriptionPlanName || "-"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-emerald-700" />
                    <p className="font-manrope text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                      {t("profile.subscriptionStarted")}
                    </p>
                  </div>
                  <p className="mt-2 font-manrope text-base font-extrabold text-slate-950">
                    {formatProfileDate(dealerProfile?.subscriptionStartedAt)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-emerald-700" />
                    <p className="font-manrope text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                      {t("profile.subscriptionExpires")}
                    </p>
                  </div>
                  <p className="mt-2 font-manrope text-base font-extrabold text-slate-950">
                    {formatProfileDate(dealerProfile?.subscriptionExpiresAt)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-emerald-700" />
                    <p className="font-manrope text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                      {t("profile.subscriptionPrice")}
                    </p>
                  </div>
                  <p className="mt-2 font-manrope text-base font-extrabold text-slate-950">
                    {formatProfilePrice(dealerProfile?.subscriptionYearlyPrice)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4">
                  <p className="font-manrope text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    {t("profile.subscriptionRemaining")}
                  </p>
                  <p className="mt-2 font-manrope text-base font-extrabold text-slate-950">
                    {getRemainingDays(dealerProfile?.subscriptionExpiresAt)}{" "}
                    {t("profile.subscriptionDays")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

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
                  <div ref={districtDropdownRef} className="space-y-2">
                    <Input
                      ref={districtInputRef}
                      value={form.district}
                      onChange={handleChange("district")}
                      onFocus={() => setShowDistrictSuggestions(true)}
                    />
                    {showDistrictSuggestions && form.district.trim().length >= 2 ? (
                      <div className="max-h-56 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                        {districtLoading ? (
                          <div className="px-4 py-3 font-manrope text-sm text-slate-500">
                            {t("profile.loading")}
                          </div>
                        ) : districtOptions.length ? (
                          districtOptions.map((district) => (
                            <button
                              key={district.id}
                              type="button"
                              onClick={() => {
                                setSelectedDistrict(district);
                                setForm((current) => ({
                                  ...current,
                                  district: district.name,
                                  mandal: "",
                                  village: "",
                                }));
                                setShowDistrictSuggestions(false);
                                setDistrictOptions([]);
                                setSelectedMandal(null);
                                setSelectedVillage(null);
                                setMandalOptions([]);
                                setVillageOptions([]);
                              }}
                              className="flex w-full flex-col items-start gap-1 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-emerald-50"
                            >
                              <span className="font-manrope text-sm font-semibold text-slate-900">
                                {district.name}
                              </span>
                              {district.stateName ? (
                                <span className="font-manrope text-xs uppercase tracking-[0.18em] text-slate-500">
                                  {district.stateName}
                                </span>
                              ) : null}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 font-manrope text-sm text-slate-500">
                            No district found
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className="font-manrope type-nav text-slate-800">
                      {t("profile.mandal")}
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 rounded-full border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
                      onClick={openMandalModal}
                    >
                      + Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Input
                      value={form.mandal}
                      onChange={handleChange("mandal")}
                      disabled={!form.state.trim() || !form.district.trim()}
                      onFocus={() => setShowMandalSuggestions(true)}
                    />
                    {form.state.trim() &&
                    form.district.trim() &&
                    form.mandal.trim().length >= 3 &&
                    showMandalSuggestions &&
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
                                  setSelectedMandal(mandal);
                                  setForm((current) => ({
                                    ...current,
                                    mandal: mandal.mandalName,
                                    village: "",
                                  }));
                                  setHideMandalSuggestions(true);
                                  setShowVillageSuggestions(false);
                                  setMandalOptions([]);
                                  setVillageOptions([]);
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
                  <div className="flex items-center justify-between gap-3">
                    <label className="font-manrope type-nav text-slate-800">
                      {t("profile.village")}
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 rounded-full border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
                      onClick={openVillageModal}
                    >
                      + Add
                    </Button>
                  </div>
                  <div ref={villageDropdownRef} className="space-y-2">
                    <Input
                      ref={villageInputRef}
                      value={form.village}
                      onChange={handleChange("village")}
                      disabled={!selectedMandal && !form.mandal.trim()}
                      onFocus={() => setShowVillageSuggestions(true)}
                    />
                    {showVillageSuggestions && (selectedMandal || form.mandal.trim()) ? (
                      <div className="max-h-56 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                        {villageLoading ? (
                          <div className="px-4 py-3 font-manrope text-sm text-slate-500">
                            {t("profile.loading")}
                          </div>
                        ) : villageOptions.length ? (
                          villageOptions.map((village) => (
                            <button
                              key={village.id}
                              type="button"
                              onClick={() => {
                                setSelectedVillage(village);
                                setForm((current) => ({
                                  ...current,
                                  village: village.name,
                                }));
                                setShowVillageSuggestions(false);
                                setVillageOptions([]);
                              }}
                              className="flex w-full flex-col items-start gap-1 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-emerald-50"
                            >
                              <span className="font-manrope text-sm font-semibold text-slate-900">
                                {village.name} village
                              </span>
                              {village.mandalName ? (
                                <span className="font-manrope text-xs uppercase tracking-[0.18em] text-slate-500">
                                  {village.mandalName} mandal
                                </span>
                              ) : null}
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

        {mandalModalOpen ? (
          <div className="kyfi-location-modal fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
            <div className="kyfi-location-modal-panel w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.25)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-manrope type-small uppercase tracking-[0.22em] text-emerald-700">
                    Add Mandal
                  </p>
                  <h3 className="mt-2 font-manrope type-card text-slate-900">
                    Create a mandal under an existing district
                  </h3>
                </div>
                <Button type="button" variant="ghost" className="kyfi-location-modal-close h-10 w-10 rounded-full" onClick={closeMandalModal}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-6 space-y-5">
                <div className="space-y-2">
                  <label className="font-manrope type-nav text-slate-800">District</label>
                  <Input
                    value={districtQuery}
                    onChange={(event) => {
                      setDistrictQuery(event.target.value);
                      setSelectedDistrict(null);
                      setShowModalDistrictOptions(true);
                    }}
                    placeholder="Type district name"
                  />
                  {showModalDistrictOptions && districtQuery.trim().length >= 2 ? (
                    <div className="max-h-56 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                      {districtSearchLoading ? (
                        <div className="px-4 py-3 font-manrope text-sm text-slate-500">Searching...</div>
                      ) : districtOptions.length ? (
                        districtOptions.map((district) => (
                          <button
                            key={district.id}
                            type="button"
                            onClick={() => {
                              setSelectedDistrict(district);
                              setDistrictQuery(district.name);
                              setDistrictOptions([]);
                              setShowModalDistrictOptions(false);
                            }}
                            className="flex w-full flex-col items-start gap-1 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-emerald-50"
                          >
                            <span className="font-manrope text-sm font-semibold text-slate-900">
                              {district.name}
                            </span>
                            {district.stateName ? (
                              <span className="font-manrope text-xs uppercase tracking-[0.18em] text-slate-500">
                                {district.stateName}
                              </span>
                            ) : null}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 font-manrope text-sm text-slate-500">
                          No district found
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label className="font-manrope type-nav text-slate-800">Mandal name</label>
                  <Input
                    value={mandalModalName}
                    onChange={(event) => setMandalModalName(event.target.value)}
                    placeholder="Enter mandal name"
                  />
                </div>

                {modalError ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 font-manrope text-sm text-red-700">
                    {modalError}
                  </div>
                ) : null}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={closeMandalModal}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="!bg-[rgb(4,120,87)] !text-white hover:!bg-[rgb(4,120,87)] hover:brightness-105"
                    onClick={handleCreateMandal}
                    disabled={mandalModalSaving}
                  >
                    {mandalModalSaving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {villageModalOpen ? (
          <div className="kyfi-location-modal fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
            <div className="kyfi-location-modal-panel w-full max-w-xl rounded-[2rem] bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.25)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-manrope type-small uppercase tracking-[0.22em] text-emerald-700">
                    Add Village
                  </p>
                  <h3 className="mt-2 font-manrope type-card text-slate-900">
                    Create a village under the selected mandal
                  </h3>
                </div>
                <Button type="button" variant="ghost" className="kyfi-location-modal-close h-10 w-10 rounded-full" onClick={closeVillageModal}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-6 space-y-5">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="font-manrope text-xs uppercase tracking-[0.22em] text-slate-500">
                    Selected mandal
                  </p>
                  <p className="mt-2 font-manrope text-base font-semibold text-slate-900">
                    {form.mandal || "No mandal selected"}
                  </p>
                  <p className="mt-1 font-manrope text-sm text-slate-500">
                    {form.district || form.state || "Select a mandal first"}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="font-manrope type-nav text-slate-800">Village name</label>
                  <Input
                    value={villageModalName}
                    onChange={(event) => setVillageModalName(event.target.value)}
                    placeholder="Enter village name"
                  />
                </div>

                {modalError ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 font-manrope text-sm text-red-700">
                    {modalError}
                  </div>
                ) : null}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={closeVillageModal}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="!bg-[rgb(4,120,87)] !text-white hover:!bg-[rgb(4,120,87)] hover:brightness-105"
                    onClick={handleCreateVillage}
                    disabled={villageModalSaving}
                  >
                    {villageModalSaving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

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
