"use client";

import {
  Suspense,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KyfiToast } from "@/components/kyfi/kyfi-toast";
import { SubscriptionCheckout } from "@/components/kyfi/subscription-checkout";
import { registerDealer } from "@/lib/api/auth";
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
import { getKyfiDictionary } from "@/lib/kyfi-i18n";
import { translateRuntimeMessage } from "@/lib/kyfi-runtime-message";
import { clearSubscriptionRedirect } from "@/lib/api/subscription-expiry";

type RegisterForm = {
  shopName: string;
  ownerName: string;
  mobile: string;
  password: string;
  district: string;
  state: string;
  mandal: string;
  village: string;
  aadhaarNumber: string;
  gstNumber: string;
};

type LocationModal = null | "mandal" | "village";

const initialForm: RegisterForm = {
  shopName: "",
  ownerName: "",
  mobile: "",
  password: "",
  district: "",
  state: "",
  mandal: "",
  village: "",
  aadhaarNumber: "",
  gstNumber: "",
};

const registerGreenButtonClass =
  "rounded-full bg-[rgb(4,120,87)] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-105";

const subscriptionRequiredStorageKey = "kyfi_subscription_required";

function formatMandalSuggestion(mandal: MandalRecord) {
  return `${mandal.mandalName} mandal, ${mandal.districtName} district, ${mandal.stateName}`;
}

function formatVillageSuggestion(village: VillageSearchResult) {
  return `${village.name} village, ${village.mandalName || ""} mandal`;
}

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const english = getKyfiDictionary("en");
  const t = (key: string) => english[key] ?? key;

  const districtInputRef = useRef<HTMLInputElement | null>(null);
  const mandalInputRef = useRef<HTMLInputElement | null>(null);
  const villageInputRef = useRef<HTMLInputElement | null>(null);
  const shopNameInputRef = useRef<HTMLInputElement | null>(null);
  const ownerNameInputRef = useRef<HTMLInputElement | null>(null);
  const mobileInputRef = useRef<HTMLInputElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const aadhaarInputRef = useRef<HTMLInputElement | null>(null);
  const gstInputRef = useRef<HTMLInputElement | null>(null);
  const registerPanelScrollRef = useRef<HTMLDivElement | null>(null);
  const registerFormScrollRef = useRef<HTMLDivElement | null>(null);

  const districtDropdownRef = useRef<HTMLDivElement | null>(null);
  const mandalDropdownRef = useRef<HTMLDivElement | null>(null);
  const villageDropdownRef = useRef<HTMLDivElement | null>(null);
  const modalDropdownRef = useRef<HTMLDivElement | null>(null);

  const [form, setForm] = useState<RegisterForm>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [flowStep, setFlowStep] = useState<"register" | "subscription">("register");
  const [registeredDealer, setRegisteredDealer] = useState<{
    id?: number;
    name?: string;
    mobile?: string;
  } | null>(null);
  const [registrationSuccessOpen, setRegistrationSuccessOpen] = useState(false);
  const [progressFill, setProgressFill] = useState(false);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    tone: "success" | "error";
  }>({
    open: false,
    message: "",
    tone: "success",
  });
  const [registerScrollState, setRegisterScrollState] = useState({
    hasTop: false,
    hasBottom: false,
  });

  const [fieldErrors, setFieldErrors] = useState({
    district: "",
    mandal: "",
    village: "",
    shopName: "",
    ownerName: "",
    mobile: "",
    password: "",
    aadhaarNumber: "",
    gstNumber: "",
  });

  const [selectedDistrict, setSelectedDistrict] =
    useState<DistrictSearchResult | null>(null);
  const [selectedMandal, setSelectedMandal] = useState<MandalRecord | null>(
    null,
  );
  const [selectedVillage, setSelectedVillage] =
    useState<VillageSearchResult | null>(null);

  const [districtOptions, setDistrictOptions] = useState<
    DistrictSearchResult[]
  >([]);
  const [districtLoading, setDistrictLoading] = useState(false);
  const [showDistrictSuggestions, setShowDistrictSuggestions] = useState(false);

  const [mandalOptions, setMandalOptions] = useState<MandalRecord[]>([]);
  const [mandalLoading, setMandalLoading] = useState(false);
  const [showMandalSuggestions, setShowMandalSuggestions] = useState(false);

  const [villageOptions, setVillageOptions] = useState<VillageSearchResult[]>(
    [],
  );
  const [villageLoading, setVillageLoading] = useState(false);
  const [showVillageSuggestions, setShowVillageSuggestions] = useState(false);

  const [locationModal, setLocationModal] = useState<LocationModal>(null);
  const [modalDistrictQuery, setModalDistrictQuery] = useState("");
  const [modalDistrictOptions, setModalDistrictOptions] = useState<
    DistrictSearchResult[]
  >([]);
  const [modalDistrictLoading, setModalDistrictLoading] = useState(false);
  const [showModalDistrictOptions, setShowModalDistrictOptions] =
    useState(false);
  const [modalSelectedDistrict, setModalSelectedDistrict] =
    useState<DistrictSearchResult | null>(null);
  const [pendingLocationName, setPendingLocationName] = useState("");
  const [savingLocation, setSavingLocation] = useState(false);

  const mobilePattern = /^[6-9]\d{9}$/;
  const aadhaarPattern = /^\d{12}$/;
  const gstPattern = /^\d{2}[A-Z0-9]{13}$/;

  const showToast = (
    message: string,
    tone: "success" | "error" = "success",
  ) => {
    setToast({ open: true, message, tone });
  };

  const updateRegisterScrollState = (element: HTMLDivElement | null) => {
    if (!element) {
      return;
    }

    setRegisterScrollState({
      hasTop: element.scrollTop > 8,
      hasBottom:
        element.scrollTop + element.clientHeight < element.scrollHeight - 8,
    });
  };

  const closeToast = () => {
    setToast((current) => ({ ...current, open: false }));
  };

  useEffect(() => {
    const wantsSubscription = searchParams.get("step") === "subscription";

    if (!wantsSubscription) {
      setFlowStep("register");
      return;
    }

    const subscriptionRequired =
      window.localStorage.getItem(subscriptionRequiredStorageKey) === "1";
    const hasLoggedInDealer =
      Boolean(window.localStorage.getItem("kyfi_token")) &&
      Boolean(window.localStorage.getItem("kyfi_dealer"));

    if (subscriptionRequired || hasLoggedInDealer) {
      setFlowStep("subscription");
      return;
    }

    clearSubscriptionRedirect();
    window.localStorage.removeItem("kyfi_pending_dealer");
    setRegisteredDealer(null);
    setFlowStep("register");
    router.replace("/login");
  }, [router, searchParams]);

  useEffect(() => {
    if (flowStep === "register") {
      clearSubscriptionRedirect();
    }
  }, [flowStep]);

  useEffect(() => {
    const updateActiveScrollContainer = () => {
      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
      updateRegisterScrollState(
        isDesktop
          ? registerFormScrollRef.current
          : registerPanelScrollRef.current,
      );
    };

    const frame = window.requestAnimationFrame(updateActiveScrollContainer);
    window.addEventListener("resize", updateActiveScrollContainer);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateActiveScrollContainer);
    };
  }, [flowStep]);

  useEffect(() => {
    if (flowStep !== "subscription" || registeredDealer?.id) {
      return;
    }

    const source =
      window.localStorage.getItem("kyfi_pending_dealer") ||
      window.localStorage.getItem("kyfi_dealer");

    if (!source) {
      return;
    }

    try {
      const dealer = JSON.parse(source) as {
        id?: number;
        name?: string;
        mobile?: string;
      };

      if (dealer.id && dealer.mobile) {
        setRegisteredDealer({
          id: dealer.id,
          name: dealer.name,
          mobile: dealer.mobile,
        });
      }
    } catch {
      setRegisteredDealer(null);
    }
  }, [flowStep, registeredDealer?.id]);

  useEffect(() => {
    if (flowStep !== "subscription") {
      setProgressFill(false);
      return;
    }

    setProgressFill(false);
    const frame = window.requestAnimationFrame(() => {
      setProgressFill(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [flowStep]);

  useEffect(() => {
    if (!toast.open) {
      return;
    }

    const timeout = window.setTimeout(() => {
      closeToast();
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [toast.open]);

  useEffect(() => {
    if (!registrationSuccessOpen) {
      return;
    }

    const timeout = window.setTimeout(() => {
      router.push("/login");
    }, 3200);

    return () => window.clearTimeout(timeout);
  }, [registrationSuccessOpen, router]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;

      if (
        districtDropdownRef.current &&
        target &&
        !districtDropdownRef.current.contains(target)
      ) {
        setShowDistrictSuggestions(false);
      }
      if (
        mandalDropdownRef.current &&
        target &&
        !mandalDropdownRef.current.contains(target)
      ) {
        setShowMandalSuggestions(false);
      }
      if (
        villageDropdownRef.current &&
        target &&
        !villageDropdownRef.current.contains(target)
      ) {
        setShowVillageSuggestions(false);
      }
      if (
        modalDropdownRef.current &&
        target &&
        !modalDropdownRef.current.contains(target)
      ) {
        setModalDistrictOptions([]);
        setShowModalDistrictOptions(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    const query = form.district.trim();

    if (query.length < 2) {
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
  }, [form.district]);

  useEffect(() => {
    const districtName = form.district.trim();
    const query = form.mandal.trim();

    if (showMandalSuggestions === false || !districtName || query.length < 3) {
      setMandalOptions([]);
      setMandalLoading(false);
      return;
    }

    let isCancelled = false;
    setMandalLoading(true);
    const debounce = window.setTimeout(() => {
      fetchMandals({
        district: districtName,
        query,
      })
        .then((response) => {
          if (isCancelled) return;
          setMandalOptions(response.mandals);
          setMandalLoading(false);
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
  }, [form.district, form.mandal, showMandalSuggestions]);

  useEffect(() => {
    const mandalId = Number(selectedMandal?.id || 0);
    const query = form.village.trim();

    if (!mandalId || showVillageSuggestions === false) {
      setVillageOptions([]);
      setVillageLoading(false);
      return;
    }

    let isCancelled = false;
    setVillageLoading(true);
    const debounce = window.setTimeout(
      () => {
        const request = query
          ? searchVillages({ mandalId, query })
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
      },
      query ? 220 : 0,
    );

    return () => {
      isCancelled = true;
      window.clearTimeout(debounce);
    };
  }, [form.village, selectedMandal?.id, showVillageSuggestions]);

  useEffect(() => {
    if (locationModal !== "mandal") {
      return;
    }

    const query = modalDistrictQuery.trim();
    if (!showModalDistrictOptions || query.length < 2) {
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
  }, [modalDistrictQuery, locationModal, showModalDistrictOptions]);

  const resetDependentLocationFields = () => {
    setSelectedMandal(null);
    setSelectedVillage(null);
    setMandalOptions([]);
    setVillageOptions([]);
    setShowMandalSuggestions(false);
    setShowVillageSuggestions(false);
  };

  const chooseDistrict = (district: DistrictSearchResult) => {
    setSelectedDistrict(district);
    setForm((current) => ({
      ...current,
      district: district.name,
      state: district.stateName || current.state,
      mandal: "",
      village: "",
    }));
    resetDependentLocationFields();
    setShowDistrictSuggestions(false);
    setDistrictOptions([]);
  };

  const chooseMandal = (mandal: MandalRecord) => {
    setSelectedMandal(mandal);
    setSelectedVillage(null);
    setForm((current) => ({
      ...current,
      district: mandal.districtName || current.district,
      state: mandal.stateName || current.state,
      mandal: mandal.mandalName,
      village: "",
    }));
    setSelectedDistrict(
      mandal.districtId
        ? {
            id: mandal.districtId,
            name: mandal.districtName || "",
            stateName: mandal.stateName || null,
          }
        : selectedDistrict,
    );
    setShowMandalSuggestions(false);
    setMandalOptions([]);
    setShowVillageSuggestions(true);
    setVillageOptions([]);
  };

  const chooseVillage = (village: VillageSearchResult) => {
    setSelectedVillage(village);
    setForm((current) => ({
      ...current,
      village: village.name,
      district: village.districtName || current.district,
      state: village.stateName || current.state,
    }));
    setShowVillageSuggestions(false);
    setVillageOptions([]);
  };

  const handleChange =
    (field: keyof RegisterForm) => (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;

      setForm((current) => {
        if (field === "district") {
          return {
            ...current,
            district: value,
            mandal: "",
            village: "",
          };
        }

        if (field === "mandal") {
          return {
            ...current,
            mandal: value,
            village: "",
          };
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
      }

      if (field === "mandal") {
        setSelectedMandal(null);
        setSelectedVillage(null);
        setShowMandalSuggestions(true);
        setShowVillageSuggestions(false);
      }

      if (field === "village") {
        setSelectedVillage(null);
        setShowVillageSuggestions(true);
      }

      setFieldErrors((current) => ({ ...current, [field]: "" }));
    };

  const openMandalModal = () => {
    setPendingLocationName(form.mandal.trim());
    setModalDistrictQuery(form.district.trim());
    setModalSelectedDistrict(selectedDistrict);
    setModalDistrictOptions([]);
    setShowModalDistrictOptions(false);
    setLocationModal("mandal");
  };

  const openVillageModal = () => {
    if (!selectedMandal) {
      showToast("Select a mandal first.", "error");
      return;
    }

    setPendingLocationName(form.village.trim());
    setLocationModal("village");
  };

  const closeLocationModal = () => {
    setLocationModal(null);
    setModalDistrictQuery("");
    setModalDistrictOptions([]);
    setShowModalDistrictOptions(false);
    setModalSelectedDistrict(null);
    setPendingLocationName("");
    setSavingLocation(false);
  };

  const chooseModalDistrict = (district: DistrictSearchResult) => {
    setModalSelectedDistrict(district);
    setModalDistrictQuery(district.name);
    setModalDistrictOptions([]);
    setShowModalDistrictOptions(false);
  };

  const handleCreateMandal = async () => {
    const mandalName = pendingLocationName.trim();

    if (!modalSelectedDistrict?.id || !mandalName) {
      showToast("Select a district and enter a mandal name.", "error");
      return;
    }

    setSavingLocation(true);
    try {
      const response = await createMandal({
        districtId: modalSelectedDistrict.id,
        mandalName,
      });

      if (response.mandal) {
        const mappedDistrict: DistrictSearchResult = {
          id: response.mandal.districtId || modalSelectedDistrict.id,
          name: response.mandal.districtName || modalSelectedDistrict.name,
          stateName:
            response.mandal.stateName ||
            modalSelectedDistrict.stateName ||
            null,
        };
        const mappedMandal: MandalRecord = {
          id: response.mandal.id,
          stateName:
            response.mandal.stateName || modalSelectedDistrict.stateName || "",
          districtName:
            response.mandal.districtName || modalSelectedDistrict.name,
          mandalName: response.mandal.name,
          mandalCode: response.mandal.mandalCode || null,
          districtId: response.mandal.districtId || modalSelectedDistrict.id,
          sourceLabel: null,
        };

        setSelectedDistrict(mappedDistrict);
        setSelectedMandal(mappedMandal);
        setForm((current) => ({
          ...current,
          state: mappedDistrict.stateName || current.state,
          district: mappedDistrict.name,
          mandal: mappedMandal.mandalName,
          village: "",
        }));
      }

      showToast(response.message, "success");
      closeLocationModal();
    } catch (createError) {
      showToast(
        createError instanceof Error
          ? createError.message
          : "Unable to add mandal",
        "error",
      );
    } finally {
      setSavingLocation(false);
    }
  };

  const handleCreateVillage = async () => {
    const villageName = pendingLocationName.trim();
    const mandalId = Number(selectedMandal?.id || 0);

    if (!mandalId || !villageName) {
      showToast("Select a mandal and enter a village name.", "error");
      return;
    }

    setSavingLocation(true);
    try {
      const response = await createVillage({
        mandalId,
        villageName,
      });

      if (response.village) {
        const mappedVillage: VillageSearchResult = {
          id: response.village.id,
          name: response.village.name,
          villageCode: response.village.villageCode || null,
          mandalId: response.village.mandalId || mandalId,
          districtId:
            response.village.districtId || selectedMandal?.districtId || null,
          mandalName:
            response.village.mandalName || selectedMandal?.mandalName || null,
          districtName:
            response.village.districtName ||
            selectedMandal?.districtName ||
            null,
          stateName:
            response.village.stateName || selectedMandal?.stateName || null,
        };

        setSelectedVillage(mappedVillage);
        setForm((current) => ({
          ...current,
          state: mappedVillage.stateName || current.state,
          district: mappedVillage.districtName || current.district,
          village: mappedVillage.name,
        }));
      }

      showToast(response.message, "success");
      closeLocationModal();
    } catch (createError) {
      showToast(
        createError instanceof Error
          ? createError.message
          : "Unable to add village",
        "error",
      );
    } finally {
      setSavingLocation(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setFieldErrors({
      district: "",
      mandal: "",
      village: "",
      shopName: "",
      ownerName: "",
      mobile: "",
      password: "",
    aadhaarNumber: "",
    gstNumber: "",
  });

    const nextErrors = {
      district: form.district.trim() ? "" : "District is required.",
      mandal: form.mandal.trim() ? "" : "Mandal is required.",
      village: form.village.trim() ? "" : "Village is required.",
      shopName: form.shopName.trim() ? "" : "Shop name is required.",
      ownerName: form.ownerName.trim() ? "" : "Owner name is required.",
      mobile: mobilePattern.test(form.mobile.trim())
        ? ""
        : "Enter a valid 10-digit mobile number.",
      aadhaarNumber: aadhaarPattern.test(form.aadhaarNumber.trim())
        ? ""
        : "Enter a valid 12-digit Aadhaar number.",
      gstNumber: gstPattern.test(form.gstNumber.trim().toUpperCase())
        ? ""
        : "Enter a valid GST number.",
      password: "",
    };

    setFieldErrors(nextErrors);
    const firstInvalidField = Object.entries(nextErrors).find(([, value]) =>
      Boolean(value),
    )?.[0];
    if (firstInvalidField) {
      if (firstInvalidField === "district") districtInputRef.current?.focus();
      if (firstInvalidField === "mandal") mandalInputRef.current?.focus();
      if (firstInvalidField === "village") villageInputRef.current?.focus();
      if (firstInvalidField === "shopName") shopNameInputRef.current?.focus();
      if (firstInvalidField === "ownerName") ownerNameInputRef.current?.focus();
      if (firstInvalidField === "mobile") mobileInputRef.current?.focus();
      if (firstInvalidField === "aadhaarNumber") aadhaarInputRef.current?.focus();
      if (firstInvalidField === "gstNumber") gstInputRef.current?.focus();
      return;
    }

    if (!selectedMandal) {
      setError("Select a valid mandal from the list or add it.");
      mandalInputRef.current?.focus();
      return;
    }

    if (!selectedVillage) {
      setError("Select a valid village from the list or add it.");
      villageInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await registerDealer({
        shopName: form.shopName.trim(),
        ownerName: form.ownerName.trim(),
        mobile: form.mobile.trim(),
        password: form.password.trim() || undefined,
        district: form.district.trim(),
        state: form.state.trim(),
        mandal: form.mandal.trim(),
        village: form.village.trim(),
        aadhaarNumber: form.aadhaarNumber.trim(),
        gstNumber: form.gstNumber.trim().toUpperCase(),
      });

      if (typeof window !== "undefined" && response.dealer) {
        clearSubscriptionRedirect();
        window.localStorage.setItem(
          "kyfi_pending_dealer",
          JSON.stringify(response.dealer),
        );
        setRegisteredDealer({
          id: response.dealer.id,
          name: response.dealer.name,
          mobile: response.dealer.mobile,
        });
      }

      setRegistrationSuccessOpen(true);
      showToast(translateRuntimeMessage("Registration successful"));
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Registration failed",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const mandalDisabled = !form.district.trim();
  const villageDisabled = !selectedMandal;

  return (
    <main className="kyfi-auth-page min-h-screen bg-[#F8F7F4] px-0 py-0 lg:px-6 lg:py-6">
      <section className="grid min-h-screen overflow-hidden bg-[#F8F7F4] lg:min-h-[calc(100vh-3rem)] lg:grid-cols-2 lg:rounded-[34px] lg:shadow-[0_0_0_1px_rgba(17,24,39,0.04)]">
        <div className="order-2 hidden min-h-[280px] lg:order-1 lg:block lg:min-h-[calc(100vh-3rem)]">
          <div className="relative h-full w-full overflow-hidden">
            <img
              src="/loginbanner.png"
              alt="KYFI dealer illustration"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          </div>
        </div>

        <div
          ref={registerPanelScrollRef}
          onScroll={(event) => updateRegisterScrollState(event.currentTarget)}
          className="kyfi-register-scroll order-1 flex min-h-screen items-start justify-center overflow-y-auto bg-[#F8F7F4] px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] lg:order-2 lg:min-h-[calc(100vh-3rem)] lg:items-center lg:justify-center lg:overflow-hidden lg:bg-[linear-gradient(180deg,#F8F7F4_0%,#F6F0E7_100%)] lg:px-6 lg:py-2"
        >
          <div
            ref={registerFormScrollRef}
            onScroll={(event) => updateRegisterScrollState(event.currentTarget)}
            className="kyfi-register-scroll w-full max-w-[34rem] scroll-smooth lg:mx-auto lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:px-2"
          >
            <div
              className={[
                "pointer-events-none sticky top-0 z-30 -mb-8 h-8 bg-gradient-to-b from-[#F8F7F4] via-[#F8F7F4]/90 to-transparent transition-opacity duration-200 lg:from-[#F8F7F4]",
                registerScrollState.hasTop ? "opacity-100" : "opacity-0",
              ].join(" ")}
              aria-hidden="true"
            />
            <div className="space-y-4 px-0 py-0 lg:space-y-3 lg:px-1 lg:py-1">
              <div className="flex items-start justify-center gap-3 lg:justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src="/kyfi-logo.png"
                    alt="KYFI"
                    className="h-16 w-auto object-contain lg:h-14"
                  />
                </div>

              </div>

              <div className="text-center lg:hidden">
                <h1 className="font-manrope text-[2rem] font-black leading-[1.05] tracking-[-0.055em] text-slate-950">
                  Create account
                </h1>
                <p className="mt-2 font-manrope text-[0.86rem] font-semibold uppercase tracking-[0.18em] text-[rgb(4,120,87)]">
                  Dealer access
                </p>
              </div>

              <p className="hidden font-manrope text-[0.9rem] font-medium tracking-[0.02em] text-slate-700 lg:block lg:text-[0.88rem]">
                {t("register.dealerAccess")}
              </p>

              <div className="mx-auto w-full max-w-[24rem] px-4">
                <div className="relative h-11">
                  <div className="absolute left-12 right-12 top-1/2 z-0 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={[
                        "h-full rounded-full bg-[rgb(4,120,87)] transition-[width] duration-[900ms] ease-out",
                        progressFill ? "w-full" : "w-0",
                      ].join(" ")}
                    />
                  </div>
                  <div
                    className={[
                      "absolute left-0 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border text-[0.95rem] font-semibold shadow-sm transition-colors duration-500",
                      flowStep === "register"
                        ? "border-[rgb(4,120,87)] bg-[rgb(4,120,87)] text-white"
                        : "border-[rgb(4,120,87)] bg-[rgb(4,120,87)] text-white",
                    ].join(" ")}
                  >
                    1
                  </div>
                  <div
                    className={[
                      "absolute right-0 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border text-[0.95rem] font-semibold shadow-sm transition-colors duration-500",
                      "border-slate-300 bg-white text-slate-900",
                    ].join(" ")}
                  >
                    2
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-[0.62rem] font-black uppercase tracking-[0.22em] text-slate-500">
                  <span>Register</span>
                  <span>Subscription</span>
                </div>
              </div>

              {flowStep === "register" ? (
                <div className="grid grid-cols-2 rounded-full bg-[#EEF0EA] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.78)] lg:py-0.5">
                  <Link
                    href="/login"
                    className="rounded-full px-4 py-3 text-center text-sm font-semibold text-slate-600 transition hover:text-[rgb(4,120,87)] lg:py-2.5"
                  >
                    {t("register.login")}
                  </Link>
                  <button type="button" className={registerGreenButtonClass}>
                    {t("register.register")}
                  </button>
                </div>
              ) : null}

              {flowStep === "register" ? (
                <form
                  className="space-y-3 lg:grid lg:grid-cols-1 lg:gap-y-3 lg:space-y-0"
                  onSubmit={handleSubmit}
                >
                  <div className="space-y-2">
                    <label className="font-manrope type-nav text-slate-800">
                      {t("register.state")}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.state}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          state: event.target.value,
                        }))
                      }
                      required
                      aria-invalid={Boolean(fieldErrors.district)}
                      className="flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 font-manrope type-nav text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    >
                      <option value="" disabled>
                        {t("register.stateSelect")}
                      </option>
                      <option value="Andhra Pradesh">Andhra Pradesh</option>
                      <option value="Telangana">Telangana</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="font-manrope type-nav text-slate-800">
                      {t("register.district")}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative" ref={districtDropdownRef}>
                      <Input
                        ref={districtInputRef}
                        placeholder={t("register.districtPlaceholder")}
                        value={form.district}
                        onChange={handleChange("district")}
                        onFocus={() => setShowDistrictSuggestions(true)}
                        required
                        aria-invalid={Boolean(fieldErrors.district)}
                        className={
                          fieldErrors.district
                            ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-100"
                            : ""
                        }
                      />
                      {form.district.trim().length >= 2 &&
                      showDistrictSuggestions ? (
                        <div className="absolute left-0 top-full z-20 mt-2 max-h-56 w-full overflow-auto rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                          {districtLoading ? (
                            <div className="px-4 py-3 font-manrope text-sm text-slate-500">
                              Searching districts...
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
                                    state: district.stateName || current.state,
                                    mandal: "",
                                    village: "",
                                  }));
                                  setSelectedMandal(null);
                                  setSelectedVillage(null);
                                  setMandalOptions([]);
                                  setVillageOptions([]);
                                  setShowDistrictSuggestions(false);
                                  setShowMandalSuggestions(false);
                                  setShowVillageSuggestions(false);
                                }}
                                className="flex w-full flex-col items-start gap-1 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-emerald-50"
                              >
                                <span className="font-manrope text-sm font-semibold text-slate-900">
                                  {district.name}
                                </span>
                                <span className="text-[0.68rem] font-medium text-slate-500">
                                  {district.stateName || "-"}
                                </span>
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-3 font-manrope text-sm text-slate-500">
                              No matching district found.
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                    {fieldErrors.district ? (
                      <p className="font-manrope text-sm text-red-600">
                        {fieldErrors.district}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <label className="font-manrope type-nav text-slate-800">
                        {t("register.mandal")}{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 rounded-full border-emerald-200 bg-emerald-50 px-4 text-[0.72rem] font-black uppercase tracking-[0.22em] text-emerald-900 hover:bg-emerald-100"
                        onClick={openMandalModal}
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        Add
                      </Button>
                    </div>
                    <div className="relative" ref={mandalDropdownRef}>
                      <Input
                        ref={mandalInputRef}
                        placeholder={
                          mandalDisabled
                            ? "Select district first"
                            : "Type 3 or more letters"
                        }
                        value={form.mandal}
                        onChange={handleChange("mandal")}
                        onFocus={() => setShowMandalSuggestions(true)}
                        disabled={mandalDisabled}
                        required
                        aria-invalid={Boolean(fieldErrors.mandal)}
                        className={
                          fieldErrors.mandal
                            ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-100"
                            : ""
                        }
                      />
                      {form.district.trim() &&
                      form.mandal.trim().length >= 3 &&
                      showMandalSuggestions ? (
                        <div className="absolute left-0 top-full z-20 mt-2 max-h-56 w-full overflow-auto rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                          {mandalLoading ? (
                            <div className="px-4 py-3 font-manrope text-sm text-slate-500">
                              Searching mandals...
                            </div>
                          ) : mandalOptions.length ? (
                            mandalOptions.map((mandal) => (
                              <button
                                key={mandal.id}
                                type="button"
                                onClick={() => chooseMandal(mandal)}
                                className="flex w-full flex-col items-start gap-1 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-emerald-50"
                              >
                                <span className="font-manrope text-sm font-semibold text-slate-900">
                                  {formatMandalSuggestion(mandal)}
                                </span>
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-3 font-manrope text-sm text-slate-500">
                              No matching mandal found.
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                    {fieldErrors.mandal ? (
                      <p className="font-manrope text-sm text-red-600">
                        {fieldErrors.mandal}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <label className="font-manrope type-nav text-slate-800">
                        {t("register.village")}{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 rounded-full border-emerald-200 bg-emerald-50 px-4 text-[0.72rem] font-black uppercase tracking-[0.22em] text-emerald-900 hover:bg-emerald-100"
                        onClick={openVillageModal}
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        Add
                      </Button>
                    </div>
                    <div className="relative" ref={villageDropdownRef}>
                      <Input
                        ref={villageInputRef}
                        placeholder={
                          villageDisabled
                            ? "Select a mandal first"
                            : "Type or choose a village"
                        }
                        value={form.village}
                        onChange={handleChange("village")}
                        onFocus={() => setShowVillageSuggestions(true)}
                        disabled={villageDisabled}
                        required
                        aria-invalid={Boolean(fieldErrors.village)}
                        className={
                          fieldErrors.village
                            ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-100"
                            : ""
                        }
                      />
                      {selectedMandal &&
                      form.village.trim().length >= 2 &&
                      showVillageSuggestions ? (
                        <div className="absolute left-0 top-full z-20 mt-2 max-h-56 w-full overflow-auto rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                          {villageLoading ? (
                            <div className="px-4 py-3 font-manrope text-sm text-slate-500">
                              Searching villages...
                            </div>
                          ) : villageOptions.length ? (
                            villageOptions.map((village) => (
                              <button
                                key={village.id}
                                type="button"
                                onClick={() => chooseVillage(village)}
                                className="flex w-full flex-col items-start gap-1 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-emerald-50"
                              >
                                <span className="font-manrope text-sm font-semibold text-slate-900">
                                  {formatVillageSuggestion(village)}
                                </span>
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-3 font-manrope text-sm text-slate-500">
                              No matching village found.
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                    {fieldErrors.village ? (
                      <p className="font-manrope text-sm text-red-600">
                        {fieldErrors.village}
                      </p>
                    ) : null}
                  </div>

                  <div className="grid gap-3 lg:grid-cols-1 lg:gap-3">
                    <div className="space-y-2">
                      <label className="font-manrope type-nav text-slate-800">
                        {t("register.shopName")}{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <Input
                        ref={shopNameInputRef}
                        placeholder={t("register.shopPlaceholder")}
                        value={form.shopName}
                        onChange={handleChange("shopName")}
                        required
                        aria-invalid={Boolean(fieldErrors.shopName)}
                        className={
                          fieldErrors.shopName
                            ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-100"
                            : ""
                        }
                      />
                      {fieldErrors.shopName ? (
                        <p className="font-manrope text-sm text-red-600">
                          {fieldErrors.shopName}
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <label className="font-manrope type-nav text-slate-800">
                        {t("register.ownerName")}{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <Input
                        ref={ownerNameInputRef}
                        placeholder={t("register.ownerPlaceholder")}
                        value={form.ownerName}
                        onChange={handleChange("ownerName")}
                        required
                        aria-invalid={Boolean(fieldErrors.ownerName)}
                        className={
                          fieldErrors.ownerName
                            ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-100"
                            : ""
                        }
                      />
                      {fieldErrors.ownerName ? (
                        <p className="font-manrope text-sm text-red-600">
                          {fieldErrors.ownerName}
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <label className="font-manrope type-nav text-slate-800">
                        {t("register.mobile")}{" "}
                        <span className="text-red-500">*</span>
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
                        className={
                          fieldErrors.mobile
                            ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-100"
                            : ""
                        }
                      />
                      {fieldErrors.mobile ? (
                        <p className="font-manrope text-sm text-red-600">
                          {fieldErrors.mobile}
                        </p>
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
                            fieldErrors.password
                              ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-100"
                              : "",
                            "pr-11",
                          ].join(" ")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {fieldErrors.password ? (
                        <p className="font-manrope text-sm text-red-600">
                          {fieldErrors.password}
                        </p>
                      ) : null}
                    </div>

                      <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
                        <div className="space-y-2">
                          <label className="font-manrope type-nav text-slate-800">
                            Aadhaar Number <span className="text-red-500">*</span>
                          </label>
                          <Input
                            ref={aadhaarInputRef}
                            placeholder="Enter Aadhaar number"
                            maxLength={12}
                            inputMode="numeric"
                            value={form.aadhaarNumber}
                            onChange={handleChange("aadhaarNumber")}
                            required
                            aria-invalid={Boolean(fieldErrors.aadhaarNumber)}
                            className={
                              fieldErrors.aadhaarNumber
                                ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-100"
                                : ""
                            }
                          />
                          <p className="font-manrope type-small text-slate-500">
                            Only 12 digits allowed.
                          </p>
                          {fieldErrors.aadhaarNumber ? (
                            <p className="font-manrope text-sm text-red-600">
                              {fieldErrors.aadhaarNumber}
                            </p>
                          ) : null}
                        </div>

                        <div className="space-y-2">
                          <label className="font-manrope type-nav text-slate-800">
                            GST Number <span className="text-red-500">*</span>
                          </label>
                          <Input
                            ref={gstInputRef}
                            placeholder="Enter GST number"
                            maxLength={15}
                            value={form.gstNumber}
                            onChange={handleChange("gstNumber")}
                            required
                            aria-invalid={Boolean(fieldErrors.gstNumber)}
                            className={
                              fieldErrors.gstNumber
                                ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-100"
                                : ""
                            }
                          />
                          <p className="font-manrope type-small text-slate-500">
                            Example: 22AAAAA0000A1Z5
                          </p>
                          {fieldErrors.gstNumber ? (
                            <p className="font-manrope text-sm text-red-600">
                              {fieldErrors.gstNumber}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>

                  {error ? (
                    <p className="font-manrope type-small text-red-600">{error}</p>
                  ) : null}

                  <Button
                    size="lg"
                    className="w-full !bg-[rgb(4,120,87)] !text-white hover:!bg-[rgb(4,120,87)] hover:brightness-105"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? t("register.loading")
                      : t("register.submit")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
              ) : (
                <div className="mt-6">
                  <SubscriptionCheckout
                    variant="embedded"
                    dealer={registeredDealer}
                    onSuccess={() => router.push("/login")}
                  />
                </div>
              )}
            </div>
            <div
              className={[
                "pointer-events-none sticky bottom-0 z-30 -mt-8 h-10 bg-gradient-to-t from-[#F8F7F4] via-[#F8F7F4]/95 to-transparent transition-opacity duration-200 lg:from-[#F6F0E7]",
                registerScrollState.hasBottom ? "opacity-100" : "opacity-0",
              ].join(" ")}
              aria-hidden="true"
            />
          </div>
        </div>
      </section>

      {locationModal ? (
        <div
          className="kyfi-location-modal fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-[2px]"
          onClick={closeLocationModal}
        >
          <div
            className="kyfi-location-modal-panel w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-[0_28px_80px_rgba(15,23,42,0.22)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 px-6 py-5">
              <div>
                <p className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-emerald-700">
                  {locationModal === "mandal" ? "Add Mandal" : "Add Village"}
                </p>
                <h2 className="mt-1 font-manrope text-xl font-extrabold tracking-[-0.04em] text-slate-950">
                  {locationModal === "mandal"
                    ? "Create a mandal under an existing district"
                    : "Create a village under the selected mandal"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeLocationModal}
                className="kyfi-location-modal-close inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 sm:border-slate-200 sm:text-slate-600 sm:shadow-none"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              {locationModal === "mandal" ? (
                <>
                  <div className="relative space-y-2" ref={modalDropdownRef}>
                    <label className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-slate-500">
                      District
                    </label>
                    <Input
                      value={modalDistrictQuery}
                      onChange={(event) => {
                        setModalSelectedDistrict(null);
                        setModalDistrictQuery(event.target.value);
                        setShowModalDistrictOptions(true);
                      }}
                      placeholder="Type district name"
                      className="h-12 w-full rounded-full border border-slate-200 bg-white shadow-none focus:border-[rgb(4,120,87)]"
                    />
                    {showModalDistrictOptions &&
                    modalDistrictQuery.trim().length >= 2 ? (
                      <div className="absolute left-0 top-full z-20 mt-2 max-h-56 w-full overflow-auto rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                        {modalDistrictLoading ? (
                          <div className="px-4 py-3 text-sm text-slate-500">
                            Searching districts...
                          </div>
                        ) : modalDistrictOptions.length ? (
                          modalDistrictOptions.map((district) => (
                            <button
                              key={district.id}
                              type="button"
                              onClick={() => chooseModalDistrict(district)}
                              className={[
                                "flex w-full flex-col items-start gap-1 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-emerald-50",
                                district.id === modalSelectedDistrict?.id
                                  ? "bg-emerald-50"
                                  : "",
                              ].join(" ")}
                            >
                              <span className="font-manrope text-sm font-semibold text-slate-900">
                                {district.name}
                              </span>
                              <span className="text-[0.68rem] font-medium text-slate-500">
                                {district.stateName || "-"}
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-slate-500">
                            No matching district found.
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-slate-500">
                      Mandal name
                    </label>
                    <Input
                      value={pendingLocationName}
                      onChange={(event) =>
                        setPendingLocationName(event.target.value)
                      }
                      placeholder="Enter mandal name"
                      className="h-12 w-full rounded-full border border-slate-200 bg-white shadow-none focus:border-[rgb(4,120,87)]"
                    />
                  </div>
                </>
              ) : null}

              {locationModal === "village" ? (
                <>
                  <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-slate-500">
                      Selected mandal
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {selectedMandal?.mandalName || form.mandal}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-600">
                      {selectedMandal?.districtName || form.district || "-"}{" "}
                      district, {selectedMandal?.stateName || form.state || "-"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-slate-500">
                      Village name
                    </label>
                    <Input
                      value={pendingLocationName}
                      onChange={(event) =>
                        setPendingLocationName(event.target.value)
                      }
                      placeholder="Enter village name"
                      className="h-12 w-full rounded-full border border-slate-200 bg-white shadow-none focus:border-[rgb(4,120,87)]"
                    />
                  </div>
                </>
              ) : null}

              <div className="flex flex-col gap-3 border-t border-slate-200/80 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <p className="text-sm text-slate-600">
                  {locationModal === "mandal"
                    ? "District is required. Mandal name is required."
                    : "Mandal is already selected. Village name is required."}
                </p>
                <div className="flex w-full items-center justify-end gap-3 sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeLocationModal}
                    className="rounded-full"
                    disabled={savingLocation}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={
                      locationModal === "mandal"
                        ? handleCreateMandal
                        : handleCreateVillage
                    }
                    className="rounded-full !bg-[rgb(4,120,87)] !text-white"
                    disabled={savingLocation}
                  >
                    {savingLocation ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {registrationSuccessOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-[28px] bg-white p-7 text-center shadow-[0_28px_90px_rgba(15,23,42,0.24)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-[rgb(4,120,87)]">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="mt-5 font-manrope text-2xl font-black tracking-[-0.04em] text-slate-950">
              Registration successful
            </h2>
            <p className="mt-3 font-manrope text-base leading-7 text-slate-600">
              Your free trial has started. You can now enjoy your free trial.
            </p>
            <p className="mt-5 font-manrope text-sm font-semibold text-[rgb(4,120,87)]">
              Redirecting to login...
            </p>
          </div>
        </div>
      ) : null}

      <KyfiToast
        open={toast.open}
        message={toast.message}
        tone={toast.tone}
        onClose={closeToast}
      />
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterPageContent />
    </Suspense>
  );
}
