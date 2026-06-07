"use client";

import { type ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useAdminLanguage } from "@/components/admin-language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KYFI_API_BASE_URL } from "@/lib/config";
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

type DistrictSearchResult = {
  id: number;
  name: string;
  stateName?: string | null;
};

type VillageSearchResult = {
  id: number;
  name: string;
  villageCode?: string | null;
  mandalId?: number | null;
  districtId?: number | null;
  mandalName?: string | null;
  districtName?: string | null;
  stateName?: string | null;
};

type LocationModal = null | "mandal" | "village";

function getToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("kyfi_admin_token") ?? "";
}

async function requestJson<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(`${KYFI_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
  });

  const data = (await response.json().catch(() => null)) as T & { message?: string } | null;

  if (!response.ok) {
    throw new Error((data as { message?: string } | null)?.message || "Request failed");
  }

  return data as T;
}

async function searchDistricts(query: string) {
  const searchParams = new URLSearchParams();
  searchParams.set("q", query);

  const response = await fetch(`${KYFI_API_BASE_URL}/districts/search?${searchParams.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
  });

  const data = (await response.json().catch(() => null)) as
    | { districts?: DistrictSearchResult[]; message?: string }
    | null;

  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return Array.isArray(data?.districts) ? data.districts : [];
}

async function searchVillages(params: { mandalId: number; query: string }) {
  const searchParams = new URLSearchParams();
  searchParams.set("mandalId", String(params.mandalId));
  searchParams.set("q", params.query);

  const response = await fetch(`${KYFI_API_BASE_URL}/villages/search?${searchParams.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
  });

  const data = (await response.json().catch(() => null)) as
    | { villages?: VillageSearchResult[]; message?: string }
    | null;

  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return Array.isArray(data?.villages) ? data.villages : [];
}

async function fetchVillagesByMandal(mandalId: number) {
  const response = await fetch(`${KYFI_API_BASE_URL}/villages/by-mandal/${mandalId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
  });

  const data = (await response.json().catch(() => null)) as
    | { villages?: VillageSearchResult[]; message?: string }
    | null;

  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return Array.isArray(data?.villages) ? data.villages : [];
}

async function createMandal(input: { districtId: number; mandalName: string }) {
  return requestJson<{
    message: string;
    mandal: {
      id: number;
      name: string;
      mandalCode?: string | null;
      districtId?: number | null;
      districtName?: string | null;
      stateName?: string | null;
    } | null;
  }>("/mandals", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

async function createVillage(input: { mandalId: number; villageName: string }) {
  return requestJson<{
    message: string;
    village: {
      id: number;
      name: string;
      villageCode?: string | null;
      mandalId?: number | null;
      districtId?: number | null;
      mandalName?: string | null;
      districtName?: string | null;
      stateName?: string | null;
    } | null;
  }>("/villages", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

const formatMandalSuggestion = (mandal: MandalRecord) =>
  `${mandal.mandalName} mandal, ${mandal.districtName} district, ${mandal.stateName}`;

const formatVillageSuggestion = (village: VillageSearchResult) =>
  `${village.name} village, ${village.mandalName || ""} mandal`;

export function DealerAddForm() {
  const router = useRouter();
  const { t } = useAdminLanguage();

  const districtInputRef = useRef<HTMLInputElement | null>(null);
  const mandalInputRef = useRef<HTMLInputElement | null>(null);
  const villageInputRef = useRef<HTMLInputElement | null>(null);
  const districtDropdownRef = useRef<HTMLDivElement | null>(null);
  const mandalDropdownRef = useRef<HTMLDivElement | null>(null);
  const villageDropdownRef = useRef<HTMLDivElement | null>(null);
  const modalDropdownRef = useRef<HTMLDivElement | null>(null);

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
  const [showPassword, setShowPassword] = useState(false);

  const [selectedDistrict, setSelectedDistrict] = useState<DistrictSearchResult | null>(null);
  const [selectedMandal, setSelectedMandal] = useState<MandalRecord | null>(null);
  const [selectedVillage, setSelectedVillage] = useState<VillageSearchResult | null>(null);

  const [districtOptions, setDistrictOptions] = useState<DistrictSearchResult[]>([]);
  const [districtLoading, setDistrictLoading] = useState(false);
  const [showDistrictSuggestions, setShowDistrictSuggestions] = useState(false);

  const [mandalOptions, setMandalOptions] = useState<MandalRecord[]>([]);
  const [mandalLoading, setMandalLoading] = useState(false);
  const [showMandalSuggestions, setShowMandalSuggestions] = useState(false);
  const [hideMandalSuggestions, setHideMandalSuggestions] = useState(false);

  const [villageOptions, setVillageOptions] = useState<VillageSearchResult[]>([]);
  const [villageLoading, setVillageLoading] = useState(false);
  const [showVillageSuggestions, setShowVillageSuggestions] = useState(false);

  const [locationModal, setLocationModal] = useState<LocationModal>(null);
  const [modalDistrictQuery, setModalDistrictQuery] = useState("");
  const [modalDistrictOptions, setModalDistrictOptions] = useState<DistrictSearchResult[]>([]);
  const [modalDistrictLoading, setModalDistrictLoading] = useState(false);
  const [modalSelectedDistrict, setModalSelectedDistrict] =
    useState<DistrictSearchResult | null>(null);
  const [pendingLocationName, setPendingLocationName] = useState("");
  const [savingLocation, setSavingLocation] = useState(false);
  const [modalError, setModalError] = useState("");

  const mobilePattern = /^[6-9]\d{9}$/;
  const aadhaarPattern = /^\d{12}$/;
  const gstPattern = /^\d{2}[A-Z0-9]{13}$/;

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;

      if (districtDropdownRef.current && target && !districtDropdownRef.current.contains(target)) {
        setShowDistrictSuggestions(false);
      }
      if (mandalDropdownRef.current && target && !mandalDropdownRef.current.contains(target)) {
        setShowMandalSuggestions(false);
      }
      if (villageDropdownRef.current && target && !villageDropdownRef.current.contains(target)) {
        setShowVillageSuggestions(false);
      }
      if (modalDropdownRef.current && target && !modalDropdownRef.current.contains(target)) {
        setModalDistrictOptions([]);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

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

    if (hideMandalSuggestions || !districtName || mandalQuery.length < 3 || !showMandalSuggestions) {
      setMandalOptions([]);
      setMandalLoading(false);
      return;
    }

    let isCancelled = false;
    setMandalLoading(true);

    const debounce = window.setTimeout(() => {
      fetchMandals({
        district: districtName,
        query: mandalQuery,
      })
        .then((response) => {
          if (!isCancelled) {
            setMandalOptions(response.mandals);
            setMandalLoading(false);
          }
        })
        .catch(() => {
          if (!isCancelled) {
            setMandalOptions([]);
            setMandalLoading(false);
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
    if (locationModal !== "mandal") {
      return;
    }

    const query = modalDistrictQuery.trim();
    if (query.length < 2) {
      setModalDistrictOptions([]);
      setModalDistrictLoading(false);
      return;
    }

    let isCancelled = false;
    setModalDistrictLoading(true);

    const debounce = window.setTimeout(() => {
      searchDistricts(query)
        .then((items) => {
          if (isCancelled) return;
          setModalDistrictOptions(items);
          setModalDistrictLoading(false);
        })
        .catch(() => {
          if (!isCancelled) {
            setModalDistrictOptions([]);
            setModalDistrictLoading(false);
          }
        });
    }, 200);

    return () => {
      isCancelled = true;
      window.clearTimeout(debounce);
    };
  }, [modalDistrictQuery, locationModal]);

  const updateField = (field: keyof DealerRegisterForm) => {
    return (event: ChangeEvent<HTMLInputElement>) => {
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
    };
  };

  const openMandalModal = () => {
    setModalError("");
    setModalDistrictQuery(form.district.trim());
    setModalSelectedDistrict(
      districtOptions.find(
        (district) => district.name.trim().toLowerCase() === form.district.trim().toLowerCase(),
      ) ?? null,
    );
    setPendingLocationName("");
    setLocationModal("mandal");
  };

  const openVillageModal = () => {
    if (!selectedMandal && !form.mandal.trim()) {
      setModalError("Select a mandal first.");
      return;
    }

    setModalError("");
    setPendingLocationName("");
    setLocationModal("village");
  };

  const closeModal = () => {
    setLocationModal(null);
    setModalDistrictQuery("");
    setModalDistrictOptions([]);
    setModalDistrictLoading(false);
    setModalSelectedDistrict(null);
    setPendingLocationName("");
    setModalError("");
  };

  const handleCreateMandal = async () => {
    const trimmedName = pendingLocationName.trim();
    const district = modalSelectedDistrict ?? modalDistrictOptions[0] ?? null;

    if (!district) {
      setModalError("Select a district first.");
      return;
    }

    if (!trimmedName) {
      setModalError("Enter mandal name.");
      return;
    }

    setSavingLocation(true);
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
      setSelectedDistrict(district);
      setSelectedMandal(mandal ? { id: mandal.id, mandalName: mandal.name, districtName: mandal.districtName || district.name, stateName: mandal.stateName || form.state, sourceLabel: null } : null);
      setSelectedVillage(null);
      setHideMandalSuggestions(true);
      setMandalOptions([]);
      setVillageOptions([]);
      closeModal();
    } catch (createError) {
      setModalError(createError instanceof Error ? createError.message : "Unable to add mandal.");
    } finally {
      setSavingLocation(false);
    }
  };

  const handleCreateVillage = async () => {
    const trimmedName = pendingLocationName.trim();
    const currentMandalName = form.mandal.trim();

    if (!currentMandalName) {
      setModalError("Select a mandal first.");
      return;
    }

    if (!trimmedName) {
      setModalError("Enter village name.");
      return;
    }

    setSavingLocation(true);
    setModalError("");

    try {
      let mandalMatch = mandalOptions.find(
        (entry) => entry.mandalName.trim().toLowerCase() === currentMandalName.toLowerCase(),
      );

      if (!mandalMatch) {
        const response = await fetchMandals({
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
      setSelectedMandal(mandalMatch);
      setSelectedVillage(
        village
          ? {
              id: village.id,
              name: village.name,
              villageCode: village.villageCode ?? null,
              mandalId: village.mandalId ?? mandalMatch.id,
              districtId: village.districtId ?? null,
              mandalName: village.mandalName ?? mandalMatch.mandalName,
              districtName: village.districtName ?? mandalMatch.districtName,
              stateName: village.stateName ?? mandalMatch.stateName,
            }
          : null,
      );
      setVillageOptions([]);
      closeModal();
    } catch (createError) {
      setModalError(createError instanceof Error ? createError.message : "Unable to add village.");
    } finally {
      setSavingLocation(false);
    }
  };

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
    <>
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
                    district: "",
                    mandal: "",
                    village: "",
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
              <div ref={districtDropdownRef} className="space-y-2">
                <Input
                  ref={districtInputRef}
                  value={form.district}
                  onChange={updateField("district")}
                  onFocus={() => setShowDistrictSuggestions(true)}
                  autoComplete="off"
                  required
                  placeholder="Guntur"
                />
                {showDistrictSuggestions && form.district.trim().length >= 2 ? (
                  <div className="max-h-56 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                    {districtLoading ? (
                      <div className="px-4 py-3 text-sm text-slate-500">{t("register.loading")}</div>
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
                            setHideMandalSuggestions(false);
                          }}
                          className="flex w-full flex-col items-start gap-1 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-emerald-50"
                        >
                          <span className="text-sm font-semibold text-slate-900">{district.name}</span>
                          {district.stateName ? (
                            <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                              {district.stateName}
                            </span>
                          ) : null}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-slate-500">{t("register.noDistrict")}</div>
                    )}
                  </div>
                ) : null}
              </div>
            </label>

            <label className="space-y-2 text-sm">
              {t("register.mandal")}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Input
                      ref={mandalInputRef}
                      value={form.mandal}
                      onChange={updateField("mandal")}
                      onFocus={() => setShowMandalSuggestions(true)}
                      autoComplete="off"
                      required
                      placeholder="Tenali"
                      disabled={!form.state.trim() || !form.district.trim()}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0 rounded-full border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
                    onClick={openMandalModal}
                  >
                    + Add
                  </Button>
                </div>

                {form.state.trim() &&
                form.district.trim() &&
                form.mandal.trim().length >= 3 &&
                showMandalSuggestions &&
                !hideMandalSuggestions ? (
                  <div ref={mandalDropdownRef} className="max-h-56 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                    {mandalLoading ? (
                      <div className="px-4 py-3 text-sm text-slate-500">{t("register.searchingMandals")}</div>
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
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Input
                      ref={villageInputRef}
                      value={form.village}
                      onChange={updateField("village")}
                      onFocus={() => setShowVillageSuggestions(true)}
                      autoComplete="off"
                      required
                      placeholder="Kollipara"
                      disabled={!selectedMandal && !form.mandal.trim()}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0 rounded-full border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
                    onClick={openVillageModal}
                  >
                    + Add
                  </Button>
                </div>

                {showVillageSuggestions && (selectedMandal || form.mandal.trim()) ? (
                  <div ref={villageDropdownRef} className="max-h-56 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                    {villageLoading ? (
                      <div className="px-4 py-3 text-sm text-slate-500">{t("register.loading")}</div>
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
                          <span className="text-sm font-semibold text-slate-900">
                            {formatVillageSuggestion(village)}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-slate-500">{t("register.noVillage")}</div>
                    )}
                  </div>
                ) : null}
              </div>
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

      {locationModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.25)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                  {locationModal === "mandal" ? "Add Mandal" : "Add Village"}
                </p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {locationModal === "mandal"
                    ? "Create a mandal under an existing district"
                    : "Create a village under the selected mandal"}
                </h3>
              </div>
              <Button type="button" variant="ghost" className="h-10 w-10 rounded-full" onClick={closeModal}>
                ×
              </Button>
            </div>

            <div className="mt-6 space-y-5">
              {locationModal === "mandal" ? (
                <>
                  <div className="space-y-2" ref={modalDropdownRef}>
                    <label className="text-sm font-semibold text-slate-800">District</label>
                    <Input
                      value={modalDistrictQuery}
                      onChange={(event) => {
                        setModalDistrictQuery(event.target.value);
                        setModalSelectedDistrict(null);
                      }}
                      placeholder="Type district name"
                    />
                    {modalDistrictQuery.trim().length >= 2 ? (
                      <div className="max-h-56 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                        {modalDistrictLoading ? (
                          <div className="px-4 py-3 text-sm text-slate-500">Searching...</div>
                        ) : modalDistrictOptions.length ? (
                          modalDistrictOptions.map((district) => (
                            <button
                              key={district.id}
                              type="button"
                              onClick={() => {
                                setModalSelectedDistrict(district);
                                setModalDistrictQuery(district.name);
                                setModalDistrictOptions([]);
                              }}
                              className="flex w-full flex-col items-start gap-1 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-emerald-50"
                            >
                              <span className="text-sm font-semibold text-slate-900">{district.name}</span>
                              {district.stateName ? (
                                <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                                  {district.stateName}
                                </span>
                              ) : null}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-slate-500">No district found</div>
                        )}
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-800">Mandal name</label>
                    <Input
                      value={pendingLocationName}
                      onChange={(event) => setPendingLocationName(event.target.value)}
                      placeholder="Enter mandal name"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Selected mandal
                    </p>
                    <p className="mt-2 text-base font-semibold text-slate-900">
                      {selectedMandal?.mandalName || form.mandal || "No mandal selected"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {selectedMandal?.districtName || form.district || "Select a mandal first"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-800">Village name</label>
                    <Input
                      value={pendingLocationName}
                      onChange={(event) => setPendingLocationName(event.target.value)}
                      placeholder="Enter village name"
                    />
                  </div>
                </>
              )}

              {modalError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {modalError}
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={closeModal}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="!bg-[rgb(4,120,87)] !text-white hover:!bg-[rgb(4,120,87)] hover:brightness-105"
                  onClick={locationModal === "mandal" ? handleCreateMandal : handleCreateVillage}
                  disabled={savingLocation}
                >
                  {savingLocation ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
