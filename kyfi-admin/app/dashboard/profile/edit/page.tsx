"use client";

import {
  type ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAdminLanguage } from "@/components/admin-language-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/navigation/page-header";
import { getStoredAdminAccess } from "@/lib/admin-permissions";
import {
  fetchMandals,
  searchDistricts,
  searchVillages,
  type DistrictSearchResult,
  type MandalRecord,
  type VillageSearchResult,
} from "@/lib/api/locations";
import {
  fetchAdminProfile,
  updateAdminProfile,
  type AdminProfile,
} from "@/lib/api/profile";

type ProfileEditForm = {
  name: string;
  mobile: string;
  shopName: string;
  state: string;
  district: string;
  mandal: string;
  village: string;
  languagePreference: "en" | "te";
};

const formatMandalSuggestion = (mandal: MandalRecord) =>
  `${mandal.mandalName} mandal, ${mandal.districtName} district, ${mandal.stateName}`;

const formatVillageSuggestion = (village: VillageSearchResult) =>
  [
    village.name,
    village.mandalName ? `${village.mandalName} mandal` : "",
    village.districtName ? `${village.districtName} district` : "",
    village.stateName,
  ]
    .filter(Boolean)
    .join(", ");

const emptyForm: ProfileEditForm = {
  name: "",
  mobile: "",
  shopName: "",
  state: "",
  district: "",
  mandal: "",
  village: "",
  languagePreference: "en",
};

function toFormState(profile: AdminProfile): ProfileEditForm {
  return {
    name: profile.name || "",
    mobile: profile.mobile || "",
    shopName: profile.shopName || "",
    state: profile.state || "",
    district: profile.district || "",
    mandal: profile.mandal || "",
    village: profile.village || "",
    languagePreference: profile.languagePreference || "en",
  };
}

export default function AdminProfileEditPage() {
  const router = useRouter();
  const { t, setLanguage } = useAdminLanguage();
  const districtDropdownRef = useRef<HTMLLabelElement | null>(null);
  const mandalDropdownRef = useRef<HTMLLabelElement | null>(null);
  const villageDropdownRef = useRef<HTMLLabelElement | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [form, setForm] = useState<ProfileEditForm>(emptyForm);
  const [districtOptions, setDistrictOptions] = useState<
    DistrictSearchResult[]
  >([]);
  const [selectedMandal, setSelectedMandal] = useState<MandalRecord | null>(
    null,
  );
  const [mandalOptions, setMandalOptions] = useState<MandalRecord[]>([]);
  const [villageOptions, setVillageOptions] = useState<VillageSearchResult[]>(
    [],
  );
  const [showDistrictSuggestions, setShowDistrictSuggestions] = useState(false);
  const [showMandalSuggestions, setShowMandalSuggestions] = useState(false);
  const [showVillageSuggestions, setShowVillageSuggestions] = useState(false);
  const [districtSearchLoading, setDistrictSearchLoading] = useState(false);
  const [mandalSearchLoading, setMandalSearchLoading] = useState(false);
  const [villageSearchLoading, setVillageSearchLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const isSuperAdmin = getStoredAdminAccess()?.adminRole === "SUPER_ADMIN";
    setHasAccess(isSuperAdmin);

    if (!isSuperAdmin) {
      setIsLoading(false);
      return;
    }

    let active = true;

    async function loadProfile() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetchAdminProfile();
        if (!active) return;

        setProfile(response.dealer);
        setForm(toFormState(response.dealer));
      } catch (loadError) {
        if (!active) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : t("profile.loadError"),
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, [t]);

  useEffect(() => {
    const query = form.district.trim();

    if (!showDistrictSuggestions || query.length < 2) {
      setDistrictOptions([]);
      setDistrictSearchLoading(false);
      return;
    }

    let isCancelled = false;
    setDistrictSearchLoading(true);

    const debounce = window.setTimeout(() => {
      searchDistricts(query)
        .then((districts) => {
          if (!isCancelled) {
            setDistrictOptions(districts);
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
  }, [form.district, showDistrictSuggestions]);

  useEffect(() => {
    const stateName = form.state.trim();
    const districtName = form.district.trim();
    const mandalQuery = form.mandal.trim();

    if (
      !showMandalSuggestions ||
      !stateName ||
      !districtName ||
      mandalQuery.length < 3
    ) {
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
  }, [form.state, form.district, form.mandal, showMandalSuggestions]);

  useEffect(() => {
    const query = form.village.trim();

    if (!showVillageSuggestions || !selectedMandal?.id || query.length < 2) {
      setVillageOptions([]);
      setVillageSearchLoading(false);
      return;
    }

    let isCancelled = false;
    setVillageSearchLoading(true);

    const debounce = window.setTimeout(() => {
      searchVillages({ mandalId: selectedMandal.id, query })
        .then((villages) => {
          if (!isCancelled) {
            setVillageOptions(villages);
            setVillageSearchLoading(false);
          }
        })
        .catch(() => {
          if (!isCancelled) {
            setVillageOptions([]);
            setVillageSearchLoading(false);
          }
        });
    }, 200);

    return () => {
      isCancelled = true;
      window.clearTimeout(debounce);
    };
  }, [form.village, selectedMandal, showVillageSuggestions]);

  useEffect(() => {
    if (
      selectedMandal ||
      !form.state.trim() ||
      !form.district.trim() ||
      !form.mandal.trim()
    ) {
      return;
    }

    let isCancelled = false;

    fetchMandals({
      state: form.state.trim(),
      district: form.district.trim(),
      query: form.mandal.trim(),
    })
      .then((response) => {
        if (isCancelled) return;
        const exactMatch = response.mandals.find(
          (mandal) =>
            mandal.mandalName.toLowerCase() === form.mandal.trim().toLowerCase(),
        );
        if (exactMatch) {
          setSelectedMandal(exactMatch);
        }
      })
      .catch(() => {
        // Keep existing profile text editable even if lookup fails.
      });

    return () => {
      isCancelled = true;
    };
  }, [form.district, form.mandal, form.state, selectedMandal]);

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      const target = event.target as Node;

      if (!districtDropdownRef.current?.contains(target)) {
        setShowDistrictSuggestions(false);
      }

      if (!mandalDropdownRef.current?.contains(target)) {
        setShowMandalSuggestions(false);
      }

      if (!villageDropdownRef.current?.contains(target)) {
        setShowVillageSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, []);

  const handleChange =
    (field: keyof ProfileEditForm) =>
    (event: ChangeEvent<HTMLInputElement>) => {
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

      if (field === "state") {
        setDistrictOptions([]);
        setMandalOptions([]);
        setVillageOptions([]);
        setSelectedMandal(null);
        setShowDistrictSuggestions(false);
        setShowMandalSuggestions(false);
        setShowVillageSuggestions(false);
      }

      if (field === "district") {
        setDistrictOptions([]);
        setMandalOptions([]);
        setVillageOptions([]);
        setSelectedMandal(null);
        setShowDistrictSuggestions(true);
        setShowMandalSuggestions(false);
        setShowVillageSuggestions(false);
      }

      if (field === "mandal") {
        setMandalOptions([]);
        setVillageOptions([]);
        setSelectedMandal(null);
        setShowMandalSuggestions(true);
        setShowVillageSuggestions(false);
      }

      if (field === "village") {
        setVillageOptions([]);
        setShowVillageSuggestions(true);
      }
    };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      const response = await updateAdminProfile({
        name: form.name.trim(),
        mobile: form.mobile.trim(),
        shopName: form.shopName.trim(),
        state: form.state.trim(),
        district: form.district.trim(),
        mandal: form.mandal.trim(),
        village: form.village.trim(),
        languagePreference: form.languagePreference,
      });

      setProfile(response.dealer);
      setForm(toFormState(response.dealer));

      if (
        response.dealer.languagePreference === "en" ||
        response.dealer.languagePreference === "te"
      ) {
        setLanguage(response.dealer.languagePreference);
      }

      router.push("/dashboard/profile");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : t("profile.loadError"),
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title={t("profile.editTitle")}
        description={t("profile.editDescription")}
        actions={
          <Button asChild variant="outline">
            <Link href="/dashboard/profile">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />

      {error ? (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!hasAccess ? (
        <Card>
          <CardContent className="p-8 text-sm text-muted-foreground">
            Profile editing is available only for Super Admin.
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card>
          <CardContent className="flex min-h-80 items-center justify-center p-6">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t("profile.loading")}</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t("profile.editTitle")}</CardTitle>
            <CardDescription>{t("profile.editDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-5" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium">
                  {t("profile.name")}
                  <Input
                    name="name"
                    value={form.name}
                    onChange={handleChange("name")}
                  />
                </label>

                <label className="space-y-2 text-sm font-medium">
                  {t("profile.mobile")}
                  <Input
                    name="mobile"
                    value={form.mobile}
                    onChange={handleChange("mobile")}
                  />
                </label>

                <label className="space-y-2 text-sm font-medium">
                  {t("profile.shopName")}
                  <Input
                    name="shopName"
                    value={form.shopName}
                    onChange={handleChange("shopName")}
                  />
                </label>

                <label className="space-y-2 text-sm font-medium">
                  {t("profile.state")}
                  <Select
                    value={form.state}
                    onValueChange={(value) => {
                      setForm((current) => ({
                        ...current,
                        state: value,
                        district: "",
                        mandal: "",
                        village: "",
                      }));
                      setDistrictOptions([]);
                      setMandalOptions([]);
                      setVillageOptions([]);
                      setSelectedMandal(null);
                      setShowDistrictSuggestions(false);
                      setShowMandalSuggestions(false);
                      setShowVillageSuggestions(false);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("register.stateSelect")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Andhra Pradesh">
                        Andhra Pradesh
                      </SelectItem>
                      <SelectItem value="Telangana">Telangana</SelectItem>
                    </SelectContent>
                  </Select>
                </label>

                <label
                  ref={districtDropdownRef}
                  className="relative space-y-2 text-sm font-medium"
                >
                  {t("profile.district")}
                  <Input
                    name="district"
                    value={form.district}
                    onChange={handleChange("district")}
                    onFocus={() => setShowDistrictSuggestions(true)}
                    disabled={!form.state.trim()}
                    autoComplete="off"
                  />
                  {form.district.trim().length >= 2 &&
                  showDistrictSuggestions ? (
                    <div className="absolute left-0 right-0 z-30 max-h-56 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                      {districtSearchLoading ? (
                        <div className="px-4 py-3 text-sm text-slate-500">
                          Searching districts...
                        </div>
                      ) : districtOptions.length ? (
                        districtOptions.map((district) => (
                          <button
                            key={district.id}
                            type="button"
                            onClick={() => {
                              setForm((current) => ({
                                ...current,
                                district: district.name,
                                mandal: "",
                                village: "",
                              }));
                              setDistrictOptions([]);
                              setMandalOptions([]);
                              setVillageOptions([]);
                              setSelectedMandal(null);
                              setShowDistrictSuggestions(false);
                            }}
                            className="flex w-full flex-col items-start gap-1 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-emerald-50"
                          >
                            <span className="text-sm font-semibold text-slate-900">
                              {district.name}
                            </span>
                            <span className="text-xs text-slate-500">
                              {district.stateName || form.state || "India"}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-slate-500">
                          No districts found.
                        </div>
                      )}
                    </div>
                  ) : null}
                </label>

                <label
                  ref={mandalDropdownRef}
                  className="relative space-y-2 text-sm font-medium"
                >
                  {t("profile.mandal")}
                  <div className="space-y-2">
                    <Input
                      name="mandal"
                      value={form.mandal}
                      onChange={handleChange("mandal")}
                      onFocus={() => setShowMandalSuggestions(true)}
                      disabled={!form.state.trim() || !form.district.trim()}
                      autoComplete="off"
                    />
                    {form.state.trim() &&
                    form.district.trim() &&
                    form.mandal.trim().length >= 3 &&
                    showMandalSuggestions ? (
                      <div className="absolute left-0 right-0 z-30 max-h-56 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
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
                                  village: "",
                                }));
                                setSelectedMandal(mandal);
                                setVillageOptions([]);
                                setShowMandalSuggestions(false);
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
                          <div className="px-4 py-3 text-sm text-slate-500">
                            {t("register.noMandal")}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </label>

                <label
                  ref={villageDropdownRef}
                  className="relative space-y-2 text-sm font-medium"
                >
                  {t("profile.village")}
                  <Input
                    name="village"
                    value={form.village}
                    onChange={handleChange("village")}
                    onFocus={() => setShowVillageSuggestions(true)}
                    disabled={!selectedMandal && !form.mandal.trim()}
                    autoComplete="off"
                  />
                  {form.village.trim().length >= 2 &&
                  showVillageSuggestions &&
                  selectedMandal?.id ? (
                    <div className="absolute left-0 right-0 z-30 max-h-56 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                      {villageSearchLoading ? (
                        <div className="px-4 py-3 text-sm text-slate-500">
                          Searching villages...
                        </div>
                      ) : villageOptions.length ? (
                        villageOptions.map((village) => (
                          <button
                            key={village.id}
                            type="button"
                            onClick={() => {
                              setForm((current) => ({
                                ...current,
                                village: village.name,
                              }));
                              setVillageOptions([]);
                              setShowVillageSuggestions(false);
                            }}
                            className="flex w-full flex-col items-start gap-1 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-emerald-50"
                          >
                            <span className="text-sm font-semibold text-slate-900">
                              {village.name}
                            </span>
                            <span className="text-xs text-slate-500">
                              {formatVillageSuggestion(village)}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-slate-500">
                          No villages found.
                        </div>
                      )}
                    </div>
                  ) : null}
                </label>

                <label className="space-y-2 text-sm font-medium">
                  {t("profile.language")}
                  <Select
                    value={form.languagePreference}
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        languagePreference: value === "te" ? "te" : "en",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("common.selectLanguage")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">
                        {t("profile.languageEnglish")}
                      </SelectItem>
                      <SelectItem value="te">
                        {t("profile.languageTelugu")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" asChild>
                  <Link href="/dashboard/profile">{t("common.cancel")}</Link>
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? t("profile.saving") : t("profile.saveChanges")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </>
  );
}
