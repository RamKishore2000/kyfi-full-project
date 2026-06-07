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
import { fetchMandals, type MandalRecord } from "@/lib/api/locations";
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

const getComponent = (
  components: GooglePlace["address_components"],
  names: string[],
) => {
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
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Google Maps failed to load")),
        {
          once: true,
        },
      );
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
  const districtInputRef = useRef<HTMLInputElement | null>(null);
  const villageInputRef = useRef<HTMLInputElement | null>(null);
  const districtAutocompleteRef = useRef<any>(null);
  const villageAutocompleteRef = useRef<any>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [form, setForm] = useState<ProfileEditForm>(emptyForm);
  const [mandalOptions, setMandalOptions] = useState<MandalRecord[]>([]);
  const [hideMandalSuggestions, setHideMandalSuggestions] = useState(false);
  const [mandalSearchLoading, setMandalSearchLoading] = useState(false);
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
    if (isLoading) {
      return;
    }

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
          const autocomplete = new window.google.maps.places.Autocomplete(
            input,
            {
              fields: ["formatted_address", "address_components", "name"],
              types: ["geocode"],
              componentRestrictions: { country: "in" },
            },
          );

          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace() as GooglePlace | undefined;
            if (!place) return;
            onPlaceSelected(place);
          });

          return autocomplete;
        };

        if (districtInputRef.current) {
          districtAutocompleteRef.current = createAutocomplete(
            districtInputRef.current,
            (place) => {
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
            },
          );
        }

        if (villageInputRef.current) {
          villageAutocompleteRef.current = createAutocomplete(
            villageInputRef.current,
            (place) => {
              const value =
                getComponent(place.address_components, [
                  "locality",
                  "sublocality_level_1",
                  "sublocality",
                  "neighborhood",
                  "administrative_area_level_3",
                ]) ||
                place.name ||
                buildAutocompleteLabel(place);

              setForm((current) => ({
                ...current,
                village: value,
              }));
            },
          );
        }
      })
      .catch(() => {
        // Keep manual entry available if Places fails to load.
      });

    return () => {
      isCancelled = true;
      if (districtAutocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(
          districtAutocompleteRef.current,
        );
      }
      if (villageAutocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(
          villageAutocompleteRef.current,
        );
      }
    };
  }, [isLoading]);

  useEffect(() => {
    const stateName = form.state.trim();
    const districtName = form.district.trim();
    const mandalQuery = form.mandal.trim();

    if (
      hideMandalSuggestions ||
      !stateName ||
      !districtName ||
      mandalQuery.length < 2
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
  }, [form.state, form.district, form.mandal, hideMandalSuggestions]);

  const handleChange =
    (field: keyof ProfileEditForm) =>
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
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        state: value,
                        mandal: "",
                      }))
                    }
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

                <label className="space-y-2 text-sm font-medium">
                  {t("profile.district")}
                  <Input
                    ref={districtInputRef}
                    name="district"
                    value={form.district}
                    onChange={handleChange("district")}
                    autoComplete="off"
                  />
                </label>

                <label className="space-y-2 text-sm font-medium">
                  {t("profile.mandal")}
                  <div className="space-y-2">
                    <Input
                      name="mandal"
                      value={form.mandal}
                      onChange={handleChange("mandal")}
                      disabled={!form.state.trim() || !form.district.trim()}
                      autoComplete="off"
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
                          <div className="px-4 py-3 text-sm text-slate-500">
                            {t("register.noMandal")}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </label>

                <label className="space-y-2 text-sm font-medium">
                  {t("profile.village")}
                  <Input
                    ref={villageInputRef}
                    name="village"
                    value={form.village}
                    onChange={handleChange("village")}
                    autoComplete="off"
                  />
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
