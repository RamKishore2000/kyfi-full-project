"use client";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { motion } from "framer-motion";
import { ImagePlus, Plus, X } from "lucide-react";
import { AuthGuard } from "@/components/kyfi/auth-guard";
import { Header } from "@/components/kyfi/header";
import { Footer } from "@/components/kyfi/footer";
import { KyfiToast } from "@/components/kyfi/kyfi-toast";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useKyfiLanguage } from "@/components/kyfi/language-provider";
import {
  addFarmerStatus,
  checkFarmerStatus,
  incrementFarmerStatusCount,
  type FarmerStatusDuplicatePolicy,
  type FarmerStatusColor,
  type FarmerStatusRecord,
} from "@/lib/api/farmer-status";
import { imageFileToWebpDataUrl } from "@/lib/image-proof";
import {
  searchMandals,
  searchVillages,
  searchDistricts,
  createMandal,
  createVillage,
  type DistrictSearchResult,
  type MandalSearchResult,
  type VillageSearchResult,
} from "@/lib/api/locations";
type FarmerStatusForm = {
  farmerName: string;
  aadhaar: string;
  mobileNumber: string;
  district: string;
  mandal: string;
  mandalId: number | null;
  village: string;
  villageId: number | null;
  address: string;
};
const initialFarmerStatusForm: FarmerStatusForm = {
  farmerName: "",
  aadhaar: "",
  mobileNumber: "",
  district: "",
  mandal: "",
  mandalId: null,
  village: "",
  villageId: null,
  address: "",
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
function maskAadhaar(value: string | null | undefined) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length >= 4
    ? `XXXX XXXX ${digits.slice(-4)}`
    : "XXXX XXXX XXXX";
}
const normalizeText = (value: string) => value.trim().toLowerCase();
export default function AddFarmerStatusPage() {
  const { language, t } = useKyfiLanguage();
  const isTe = language === "te";
  const farmerNameInputRef = useRef<HTMLInputElement | null>(null);
  const aadhaarInputRef = useRef<HTMLInputElement | null>(null);
  const mobileInputRef = useRef<HTMLInputElement | null>(null);
  const villageInputRef = useRef<HTMLInputElement | null>(null);
  const mandalInputRef = useRef<HTMLInputElement | null>(null);
  const mandalDropdownRef = useRef<HTMLDivElement | null>(null);
  const villageDropdownRef = useRef<HTMLDivElement | null>(null);
  const [selectedStatus, setSelectedStatus] =
    useState<FarmerStatusColor>("GREEN");
  const [farmerType, setFarmerType] = useState<"OLD" | "NEW">("OLD");
  const [form, setForm] = useState<FarmerStatusForm>(initialFarmerStatusForm);
  const [fieldErrors, setFieldErrors] = useState({
    farmerName: "",
    aadhaar: "",
    mobileNumber: "",
    mandal: "",
    village: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mandalOptions, setMandalOptions] = useState<MandalSearchResult[]>([]);
  const [villageOptions, setVillageOptions] = useState<VillageSearchResult[]>(
    [],
  );
  const [hideMandalSuggestions, setHideMandalSuggestions] = useState(false);
  const [hideVillageSuggestions, setHideVillageSuggestions] = useState(false);
  const [mandalSearchLoading, setMandalSearchLoading] = useState(false);
  const [villageSearchLoading, setVillageSearchLoading] = useState(false);
  const [mandalActiveIndex, setMandalActiveIndex] = useState(-1);
  const [villageActiveIndex, setVillageActiveIndex] = useState(-1);
  const [locationModal, setLocationModal] = useState<
    null | "mandal" | "village"
  >(null);
  const [districtQuery, setDistrictQuery] = useState("");
  const [districtOptions, setDistrictOptions] = useState<
    DistrictSearchResult[]
  >([]);
  const [districtSearchLoading, setDistrictSearchLoading] = useState(false);
  const [districtActiveIndex, setDistrictActiveIndex] = useState(-1);
  const [showDistrictOptions, setShowDistrictOptions] = useState(false);
  const [selectedDistrict, setSelectedDistrict] =
    useState<DistrictSearchResult | null>(null);
  const [selectedMandal, setSelectedMandal] =
    useState<MandalSearchResult | null>(null);
  const [pendingLocationName, setPendingLocationName] = useState("");
  const [savingLocation, setSavingLocation] = useState(false);
  const [existingFarmerModalOpen, setExistingFarmerModalOpen] = useState(false);
  const [existingFarmerRecord, setExistingFarmerRecord] =
    useState<FarmerStatusRecord | null>(null);
  const [existingFarmerDuplicatePolicy, setExistingFarmerDuplicatePolicy] =
    useState<FarmerStatusDuplicatePolicy>(null);
  const [existingFarmerVoting, setExistingFarmerVoting] = useState(false);
  const [currentDealerId, setCurrentDealerId] = useState<number | null>(null);
  const [oldFarmerProofImage, setOldFarmerProofImage] = useState("");
  const [oldFarmerProofError, setOldFarmerProofError] = useState("");
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    tone: "success" | "error";
  }>({ open: false, message: "", tone: "success" });
  useEffect(() => {
    if (!toast.open) return;
    const timeout = window.setTimeout(() => {
      setToast((current) => ({ ...current, open: false }));
    }, 3000);
    return () => window.clearTimeout(timeout);
  }, [toast.open]);
  useEffect(() => {
    const readDealer = () => {
      if (typeof window === "undefined") return;
      try {
        const stored = window.localStorage.getItem("kyfi_dealer");
        const parsed = stored ? JSON.parse(stored) : null;
        const dealerId = Number(parsed?.id || parsed?.dealerId || 0);
        setCurrentDealerId(
          Number.isFinite(dealerId) && dealerId > 0 ? dealerId : null,
        );
      } catch {
        setCurrentDealerId(null);
      }
    };

    readDealer();
    window.addEventListener("kyfi-auth-changed", readDealer);
    return () => window.removeEventListener("kyfi-auth-changed", readDealer);
  }, []);
  const showToast = (
    message: string,
    tone: "success" | "error" = "success",
  ) => {
    setToast({ open: true, message, tone });
  };
  const handleOldFarmerProofChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      setOldFarmerProofError("");
      const webpDataUrl = await imageFileToWebpDataUrl(file);
      setOldFarmerProofImage(webpDataUrl);
    } catch (proofError) {
      const message =
        proofError instanceof Error
          ? proofError.message
          : "Unable to prepare proof image.";
      setOldFarmerProofImage("");
      setOldFarmerProofError(message);
    }
  };
  const getLoggedInDealerId = () => {
    if (typeof window === "undefined") return null;
    try {
      const stored = window.localStorage.getItem("kyfi_dealer");
      const parsed = stored ? JSON.parse(stored) : null;
      const dealerId = Number(parsed?.id || parsed?.dealerId || 0);
      return Number.isFinite(dealerId) && dealerId > 0 ? dealerId : null;
    } catch {
      return null;
    }
  };
  const activeDealerId = currentDealerId ?? getLoggedInDealerId();
  const resetFarmerStatusForm = () => {
    setForm({ ...initialFarmerStatusForm });
    setSelectedStatus("GREEN");
    setFarmerType("OLD");
    setFieldErrors({
      farmerName: "",
      aadhaar: "",
      mobileNumber: "",
      mandal: "",
      village: "",
    });
    setOldFarmerProofImage("");
    setOldFarmerProofError("");
    setHideMandalSuggestions(false);
    setHideVillageSuggestions(false);
    setMandalOptions([]);
    setVillageOptions([]);
    setMandalActiveIndex(-1);
    setVillageActiveIndex(-1);
    setMandalSearchLoading(false);
    setVillageSearchLoading(false);
    setDistrictQuery("");
    setDistrictOptions([]);
    setDistrictActiveIndex(-1);
    setDistrictSearchLoading(false);
    setShowDistrictOptions(false);
    setSelectedDistrict(null);
    setSelectedMandal(null);
    setPendingLocationName("");
  };
  const closeExistingFarmerModal = () => {
    setExistingFarmerModalOpen(false);
    setExistingFarmerRecord(null);
    setExistingFarmerDuplicatePolicy(null);
    setExistingFarmerVoting(false);
    setOldFarmerProofImage("");
    setOldFarmerProofError("");
  };
  const handleExistingFarmerCreate = async () => {
    if (!existingFarmerRecord) return;
    setExistingFarmerVoting(true);
    setError("");
    setMessage("");
    try {
      const response = await addFarmerStatus({
        farmerName: form.farmerName.trim(),
        aadhaar: form.aadhaar.trim(),
        mobileNumber: form.mobileNumber.trim(),
        district: form.district,
        mandal: form.mandal,
        mandalId: form.mandalId,
        village: form.village,
        villageId: form.villageId,
        address: form.address.trim(),
        statusColor: selectedStatus,
        farmerType: "NEW",
      });
      setExistingFarmerRecord(response.farmerStatus ?? existingFarmerRecord);
      setExistingFarmerDuplicatePolicy(null);
      showToast(
        isTe
          ? "à°ªà±à°°à°¤à°¿ à°°à±ˆà°¤à± à°°à°¿à°•à°¾à°°à±à°¡à± à°°à±‚à°ªà°¤à±‹ à°šà±‡à°°à±à°šà°¾à°°à±."
          : "Farmer created successfully for this dealer.",
      );
      resetFarmerStatusForm();
      setExistingFarmerModalOpen(false);
      setExistingFarmerRecord(null);
      setExistingFarmerDuplicatePolicy(null);
    } catch (createError) {
      const fallbackMessage =
        createError instanceof Error
          ? createError.message
          : isTe
            ? "à°ªà±à°°à°¤à°¿ à°°à±ˆà°¤à± à°°à±‚à°ªà°•à°‚à°¤à±‹ à°šà±‡à°°à±à°šà°¡à°‚ à°µà°¿à°«à°²à°®à±ˆà°‚à°¦à°¿."
            : "Unable to create farmer record.";
      setError(fallbackMessage);
    } finally {
      setExistingFarmerVoting(false);
    }
  };
  const handleChange =
    (field: keyof FarmerStatusForm) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value =
        field === "aadhaar" || field === "mobileNumber"
          ? event.target.value.replace(/\D/g, "")
          : event.target.value;
      setForm((current) => {
        if (field === "mandal") {
          return {
            ...current,
            mandal: value,
            mandalId: null,
            district: "",
            village: "",
            villageId: null,
          };
        }
        if (field === "village") {
          return { ...current, village: value, villageId: null };
        }
        return { ...current, [field]: value };
      });
      if (field === "mandal") {
        setHideMandalSuggestions(false);
        setHideVillageSuggestions(false);
        setMandalActiveIndex(-1);
        setVillageActiveIndex(-1);
        setVillageOptions([]);
      }
      if (field === "village") {
        setHideVillageSuggestions(false);
        setVillageActiveIndex(-1);
      }
      setError("");
      setMessage("");
      if (
        field === "farmerName" ||
        field === "aadhaar" ||
        field === "mobileNumber" ||
        field === "mandal" ||
        field === "village"
      ) {
        setFieldErrors((current) => ({ ...current, [field]: "" }));
      }
    };
  useEffect(() => {
    const mandalQuery = String(form.mandal || "").trim();
    if (hideMandalSuggestions || mandalQuery.length < 3) {
      setMandalOptions([]);
      setMandalSearchLoading(false);
      return;
    }
    let isCancelled = false;
    setMandalSearchLoading(true);
    const debounce = window.setTimeout(() => {
      searchMandals(mandalQuery)
        .then((items) => {
          if (isCancelled) return;
          setMandalOptions(items);
          setMandalActiveIndex(items.length ? 0 : -1);
          setMandalSearchLoading(false);
        })
        .catch(() => {
          if (!isCancelled) {
            setMandalOptions([]);
            setMandalActiveIndex(-1);
            setMandalSearchLoading(false);
          }
        });
    }, 200);
    return () => {
      isCancelled = true;
      window.clearTimeout(debounce);
    };
  }, [form.mandal, hideMandalSuggestions]);
  useEffect(() => {
    const mandalId = Number(form.mandalId || 0);
    const villageQuery = String(form.village || "").trim();
    if (!mandalId || hideVillageSuggestions) {
      setVillageOptions([]);
      setVillageSearchLoading(false);
      return;
    }
    if (villageQuery.length < 2) {
      setVillageOptions([]);
      setVillageActiveIndex(-1);
      setVillageSearchLoading(false);
      return;
    }
    let isCancelled = false;
    setVillageSearchLoading(true);
    const debounce = window.setTimeout(
      () => {
        const request = searchVillages({ mandalId, query: villageQuery });
        request
          .then((items) => {
            if (isCancelled) return;
            setVillageOptions(items);
            setVillageActiveIndex(items.length ? 0 : -1);
            setVillageSearchLoading(false);
          })
          .catch(() => {
            if (!isCancelled) {
              setVillageOptions([]);
              setVillageActiveIndex(-1);
              setVillageSearchLoading(false);
            }
          });
      },
      220,
    );
    return () => {
      isCancelled = true;
      window.clearTimeout(debounce);
    };
  }, [form.mandalId, form.village, hideVillageSuggestions]);
  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (
        mandalDropdownRef.current &&
        target &&
        !mandalDropdownRef.current.contains(target)
      ) {
        setHideMandalSuggestions(true);
      }
      if (
        villageDropdownRef.current &&
        target &&
        !villageDropdownRef.current.contains(target)
      ) {
        setHideVillageSuggestions(true);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);
  const chooseMandal = (mandal: MandalSearchResult) => {
    setForm((current) => ({
      ...current,
      mandal: mandal.name,
      mandalId: mandal.id,
      district: mandal.districtName || current.district,
      village: "",
      villageId: null,
    }));
    setHideMandalSuggestions(true);
    setHideVillageSuggestions(true);
    setMandalOptions([]);
    setVillageOptions([]);
    setMandalActiveIndex(-1);
    setVillageActiveIndex(-1);
  };
  const chooseVillage = (village: VillageSearchResult) => {
    setForm((current) => ({
      ...current,
      village: village.name,
      villageId: village.id,
      district: village.districtName || current.district,
    }));
    setHideVillageSuggestions(true);
    setVillageOptions([]);
    setVillageActiveIndex(-1);
  };
  const handleMandalKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!mandalOptions.length || hideMandalSuggestions) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setMandalActiveIndex((current) => (current + 1) % mandalOptions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setMandalActiveIndex((current) =>
        current <= 0 ? mandalOptions.length - 1 : current - 1,
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      const selected = mandalOptions[mandalActiveIndex] || mandalOptions[0];
      if (selected) {
        chooseMandal(selected);
      }
    } else if (event.key === "Escape") {
      setHideMandalSuggestions(true);
    }
  };
  const handleVillageKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!villageOptions.length || hideVillageSuggestions) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setVillageActiveIndex((current) => (current + 1) % villageOptions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setVillageActiveIndex((current) =>
        current <= 0 ? villageOptions.length - 1 : current - 1,
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      const selected = villageOptions[villageActiveIndex] || villageOptions[0];
      if (selected) {
        chooseVillage(selected);
      }
    } else if (event.key === "Escape") {
      setHideVillageSuggestions(true);
    }
  };
  useEffect(() => {
    if (locationModal !== "mandal") {
      return;
    }
    const query = districtQuery.trim();
    if (query.length < 2) {
      setDistrictOptions([]);
      setDistrictSearchLoading(false);
      return;
    }
    let isCancelled = false;
    setDistrictSearchLoading(true);
    const debounce = window.setTimeout(() => {
      searchDistricts(query)
        .then((items) => {
          if (isCancelled) return;
          setDistrictOptions(items);
          setDistrictActiveIndex(items.length ? 0 : -1);
          setDistrictSearchLoading(false);
        })
        .catch(() => {
          if (!isCancelled) {
            setDistrictOptions([]);
            setDistrictActiveIndex(-1);
            setDistrictSearchLoading(false);
          }
        });
    }, 200);
    return () => {
      isCancelled = true;
      window.clearTimeout(debounce);
    };
  }, [districtQuery, locationModal]);
  const openMandalModal = () => {
    setPendingLocationName(form.mandal.trim());
    setSelectedDistrict(null);
    setDistrictQuery(form.district.trim());
    setDistrictOptions([]);
    setDistrictActiveIndex(-1);
    setShowDistrictOptions(false);
    setLocationModal("mandal");
  };
  const openVillageModal = () => {
    if (!form.mandalId) {
      showToast("Select a mandal first.", "error");
      return;
    }
    setPendingLocationName(form.village.trim());
    setSelectedMandal(
      mandalOptions.find((item) => item.id === form.mandalId) || null,
    );
    setLocationModal("village");
  };
  const closeLocationModal = () => {
    setLocationModal(null);
    setDistrictQuery("");
    setDistrictOptions([]);
    setDistrictActiveIndex(-1);
    setShowDistrictOptions(false);
    setSelectedDistrict(null);
    setSelectedMandal(null);
    setPendingLocationName("");
    setSavingLocation(false);
  };
  const chooseDistrict = (district: DistrictSearchResult) => {
    setSelectedDistrict(district);
    setDistrictQuery(district.name);
    setDistrictOptions([]);
    setDistrictActiveIndex(-1);
    setShowDistrictOptions(false);
  };
  const handleDistrictKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (
      !districtOptions.length ||
      !showDistrictOptions ||
      locationModal !== "mandal"
    )
      return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setDistrictActiveIndex(
        (current) => (current + 1) % districtOptions.length,
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setDistrictActiveIndex((current) =>
        current <= 0 ? districtOptions.length - 1 : current - 1,
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      const selected =
        districtOptions[districtActiveIndex] || districtOptions[0];
      if (selected) chooseDistrict(selected);
    } else if (event.key === "Escape") {
      setDistrictOptions([]);
      setShowDistrictOptions(false);
    }
  };
  const handleCreateMandal = async () => {
    const mandalName = pendingLocationName.trim();
    if (!selectedDistrict?.id || !mandalName) {
      showToast("Select a district and enter a mandal name.", "error");
      return;
    }
    setSavingLocation(true);
    try {
      const response = await createMandal({
        districtId: selectedDistrict.id,
        mandalName,
      });
      if (response.mandal) {
        setForm((current) => ({
          ...current,
          district:
            response.mandal?.districtName ||
            selectedDistrict.name ||
            current.district,
          mandal: response.mandal?.name || mandalName,
          mandalId: response.mandal?.id ?? current.mandalId,
          village: "",
          villageId: null,
        }));
      }
      showToast(response.message, "success");
      closeLocationModal();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Unable to add mandal",
        "error",
      );
    } finally {
      setSavingLocation(false);
    }
  };
  const handleCreateVillage = async () => {
    const villageName = pendingLocationName.trim();
    const mandalId = Number(form.mandalId || 0);
    if (!mandalId || !villageName) {
      showToast("Select a mandal and enter a village name.", "error");
      return;
    }
    setSavingLocation(true);
    try {
      const response = await createVillage({ mandalId, villageName });
      if (response.village) {
        setForm((current) => ({
          ...current,
          district: response.village?.districtName || current.district,
          village: response.village?.name || villageName,
          villageId: response.village?.id ?? current.villageId,
        }));
      }
      showToast(response.message, "success");
      closeLocationModal();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Unable to add village",
        "error",
      );
    } finally {
      setSavingLocation(false);
    }
  };
  const lookupExisting = async () => {
    const aadhaarNumber = String(form.aadhaar || "")
      .replace(/\s+/g, "")
      .trim();
    if (farmerType === "NEW" && !aadhaarNumber) {
      setError(
        isTe
          ? "ఉన్న రైతు రికార్డు కోసం Aadhaar నమోదు చేయండి."
          : "Enter Aadhaar number to check an existing record.",
      );
      return null;
    }
    setIsChecking(true);
    try {
      const response = await checkFarmerStatus(
        farmerType === "NEW"
          ? { aadhaar: aadhaarNumber, farmerType: "NEW" }
          : {
              mobileNumber: String(form.mobileNumber || "").trim(),
              farmerType: "OLD",
            },
      );
      if (response.exists && response.farmerStatus) {
        setExistingFarmerRecord(response.farmerStatus);
        setExistingFarmerDuplicatePolicy(response.duplicatePolicy ?? null);
        setOldFarmerProofImage("");
        setOldFarmerProofError("");
        setExistingFarmerModalOpen(true);
        setMessage(
          isTe ? "ఈ రైతు ఇప్పటికే ఉన్నాడు." : "This farmer already exists.",
        );
        return response.farmerStatus;
      }
      setExistingFarmerDuplicatePolicy(null);
      setMessage(
        isTe
          ? "ఉన్న రైతు రికార్డు కనబడలేదు."
          : "No existing farmer record found.",
      );
      return null;
    } catch (checkError) {
      setError(
        checkError instanceof Error
          ? checkError.message
          : isTe
            ? "తనిఖీ విఫలమైంది"
            : "Check failed",
      );
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
      mandal: "",
      village: "",
    });
    const aadhaar = String(form.aadhaar || "")
      .replace(/\s+/g, "")
      .trim();
    const mobileNumber = String(form.mobileNumber || "").trim();
    const farmerName = String(form.farmerName || "").trim();
    const district = String(form.district || "").trim();
    const mandal = String(form.mandal || "").trim();
    const village = String(form.village || "").trim();
    const mandalId = Number(form.mandalId || 0);
    const villageId = Number(form.villageId || 0);
    const address = String(form.address || "").trim();
    const nextErrors = {
      farmerName: farmerName
        ? ""
        : isTe
          ? "రైతు పేరు అవసరం."
          : "Farmer name is required.",
      aadhaar:
        farmerType === "NEW"
          ? aadhaar && /^\d{12}$/.test(aadhaar)
            ? ""
            : isTe
              ? "సరైన 12 అంకెల Aadhaar సంఖ్యను నమోదు చేయండి."
              : "Aadhaar number is required and must be 12 digits."
          : !aadhaar || /^\d{12}$/.test(aadhaar)
            ? ""
            : isTe
              ? "సరైన 12 అంకెల Aadhaar సంఖ్యను నమోదు చేయండి."
              : "Enter a valid 12-digit Aadhaar number.",
      mobileNumber:
        !mobileNumber || /^[6-9]\d{9}$/.test(mobileNumber)
          ? ""
          : isTe
            ? "సరైన 10 అంకెల mobile number ను నమోదు చేయండి."
            : "Enter a valid 10-digit mobile number.",
      district: district
        ? ""
        : isTe
          ? "జిల్లా అవసరం."
          : "District is required.",
      mandal:
        mandal && mandalId > 0
          ? ""
          : isTe
            ? "మండలాన్ని సూచనల నుంచి ఎంచుకోండి."
            : "Select a mandal from suggestions.",
      village:
        village && villageId > 0
          ? ""
          : isTe
            ? "గ్రామాన్ని సూచనల నుంచి ఎంచుకోండి."
            : "Select a village from suggestions.",
    };
    setFieldErrors(nextErrors);
    const firstInvalidField = Object.entries(nextErrors).find(([, value]) =>
      Boolean(value),
    )?.[0];
    if (firstInvalidField) {
      if (firstInvalidField === "farmerName")
        farmerNameInputRef.current?.focus();
      if (firstInvalidField === "aadhaar") aadhaarInputRef.current?.focus();
      if (firstInvalidField === "mobileNumber") mobileInputRef.current?.focus();
      if (firstInvalidField === "mandal") mandalInputRef.current?.focus();
      if (firstInvalidField === "village") villageInputRef.current?.focus();
      return;
    }
    if (aadhaar && aadhaar.length !== 12) {
      setError(
        isTe
          ? "Enter a valid 12-digit Aadhaar number."
          : "Enter a valid 12-digit Aadhaar number.",
      );
      return;
    }
    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      setError(
        isTe
          ? "Enter a valid 10-digit mobile number."
          : "Enter a valid 10-digit mobile number.",
      );
      return;
    }
    if (!farmerName || !mobileNumber || !mandalId || !villageId) {
      setError(
        isTe
          ? "Farmer name, mobile number, mandal, and village are required."
          : "Farmer name, mobile number, mandal, and village are required.",
      );
      return;
    }
    if (farmerType === "OLD" && !oldFarmerProofImage) {
      setOldFarmerProofError("Proof image is required for old farmer.");
      setError("Proof image is required for old farmer.");
      return;
    }
    setIsSubmitting(true);
    try {
      const existing = await lookupExisting();
      if (existing) {
        return;
      }
      const response = await addFarmerStatus({
        aadhaar: aadhaar || undefined,
        farmerType,
        farmerName,
        mobileNumber,
        district,
        mandal,
        village,
        mandalId,
        villageId,
        ...(farmerType === "NEW" ? { statusColor: selectedStatus } : {}),
        ...(farmerType === "OLD" && oldFarmerProofImage
          ? { proofImageDataUrl: oldFarmerProofImage }
          : {}),
        address: address || undefined,
      });
      const successMessage =
        farmerType === "NEW"
          ? isTe
            ? "కొత్త రైతు విజయవంతంగా జోడించబడింది"
            : "New farmer added successfully"
          : isTe
            ? "పాత రైతు విజయవంతంగా జోడించబడింది"
            : "Old farmer added successfully";
      resetFarmerStatusForm();
      showToast(successMessage);
      setMessage(successMessage);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : isTe
            ? "సేవ్ విఫలమైంది"
            : "Save failed",
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleExistingFarmerVote = async () => {
    if (!existingFarmerRecord) return;
    if (!oldFarmerProofImage) {
      setOldFarmerProofError("Select one proof image before voting.");
      return;
    }
    setExistingFarmerVoting(true);
    try {
      const response = await incrementFarmerStatusCount(
        existingFarmerRecord.id,
        oldFarmerProofImage,
      );
      if (response.farmerStatus) {
        setExistingFarmerRecord(response.farmerStatus);
      }
      resetFarmerStatusForm();
      setExistingFarmerModalOpen(false);
      setExistingFarmerRecord(null);
      setExistingFarmerDuplicatePolicy(null);
      showToast(
        isTe
          ? "మీ ఓటు విజయవంతంగా జోడించబడింది."
          : "Your vote has been added successfully.",
      );
    } catch (voteError) {
      showToast(
        voteError instanceof Error ? voteError.message : "Vote failed",
        "error",
      );
    } finally {
      setExistingFarmerVoting(false);
    }
  };
  return (
    <AuthGuard>
      <main className="kyfi-shell min-h-screen">
        {" "}
        <Header />{" "}
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {" "}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-8 max-w-3xl"
        >
          {" "}
          <p className="font-manrope type-small uppercase tracking-[0.2em] text-emerald-700">
            {" "}
            {isTe
              ? "డీలర్‌లకు మాత్రమే రికార్డు నమోదు"
              : "Dealer farmer record entry"}{" "}
          </p>{" "}
          <h1 className="mt-3 font-manrope type-section text-slate-900">
            {" "}
            {isTe ? "రైతు status జోడించండి" : "Add Farmer Record"}{" "}
          </h1>{" "}
          <p className="mt-4 font-manrope type-body">
            {" "}
            {isTe
              ? "Aadhaar ను ప్రధాన గుర్తింపుగా ఉపయోగించి సాధారణ రైతు రేప్యుటేషన్ రికార్డును సృష్టించండి."
              : "Use Old Farmer for shared farmer proof records. Use New Farmer for dealer-only reputation records."}{" "}
          </p>{" "}
        </motion.div>{" "}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          {" "}
          <Card className="overflow-hidden border-white/80 bg-white/85 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            {" "}
            <CardContent className="space-y-8 p-6 sm:p-8">
              {" "}
              <div className="space-y-6">
                {" "}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {" "}
                  <div>
                    {" "}
                    <p className="font-manrope type-nav text-slate-900">
                      {" "}
                      {isTe ? "రైతు status ఫారం" : "Farmer record form"}{" "}
                    </p>{" "}
                    <p className="mt-1 font-manrope type-body">
                      {" "}
                      {isTe
                        ? "ఇక్కడ PAN అవసరం లేదు. Aadhaar, mobile, mandal, మరియు village వాడండి."
                        : "Old Farmer needs mobile, location, and proof image. New Farmer needs Aadhaar and status."}{" "}
                    </p>{" "}
                  </div>{" "}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {" "}
                    <button
                      type="button"
                      onClick={() => {
                        setFarmerType("OLD");
                        setSelectedStatus("GREEN");
                      }}
                      className={[
                        "rounded-2xl border px-2.5 py-3 text-left transition sm:px-4 sm:py-4",
                        farmerType === "OLD"
                          ? "border-emerald-300 bg-emerald-50 text-emerald-900 shadow-[0_12px_30px_rgba(16,185,129,0.12)]"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      {" "}
                      <p className="font-manrope text-[0.88rem] font-semibold leading-tight sm:type-card">
                        {" "}
                        {t("addFarmer.tabOld")}{" "}
                      </p>{" "}
                      <p className="mt-1 hidden font-manrope type-small sm:block">
                        {" "}
                        {t("addFarmer.oldHelp")}{" "}
                      </p>{" "}
                    </button>{" "}
                    <button
                      type="button"
                      onClick={() => setFarmerType("NEW")}
                      className={[
                        "rounded-2xl border px-2.5 py-3 text-left transition sm:px-4 sm:py-4",
                        farmerType === "NEW"
                          ? "border-emerald-300 bg-emerald-50 text-emerald-900 shadow-[0_12px_30px_rgba(16,185,129,0.12)]"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      {" "}
                      <p className="font-manrope text-[0.88rem] font-semibold leading-tight sm:type-card">
                        {" "}
                        {t("addFarmer.tabNew")}{" "}
                      </p>{" "}
                      <p className="mt-1 hidden font-manrope type-small sm:block">
                        {" "}
                        {t("addFarmer.newHelp")}{" "}
                      </p>{" "}
                    </button>{" "}
                  </div>{" "}
                </div>{" "}
                {farmerType === "NEW" ? (
                  <Alert className="rounded-[28px] border-emerald-200 bg-emerald-50/55 px-5 py-5 text-slate-500">
                    {" "}
                    {isTe
                      ? "ఈ ఫారం GREEN, YELLOW, లేదా RED reputation records మాత్రమే సృష్టిస్తుంది."
                      : "New Farmer records need one status: GREEN, YELLOW, or RED."}{" "}
                  </Alert>
                ) : null}{" "}
                <form className="space-y-6" onSubmit={handleSubmit}>
                  {" "}
                  <div className="grid gap-x-4 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
                    {" "}
                    <div className="space-y-2">
                      {" "}
                      <label className="font-manrope type-nav text-slate-800">
                        {" "}
                        {isTe ? "రైతు పేరు" : "Farmer name"}{" "}
                        <span className="text-red-500">*</span>{" "}
                      </label>{" "}
                      <Input
                        ref={farmerNameInputRef}
                        placeholder={
                          isTe
                            ? "రైతు పేరును నమోదు చేయండి"
                            : "Enter farmer name"
                        }
                        value={form.farmerName}
                        onChange={handleChange("farmerName")}
                        required
                        aria-invalid={Boolean(fieldErrors.farmerName)}
                        className={
                          fieldErrors.farmerName
                            ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-100"
                            : ""
                        }
                      />{" "}
                      {fieldErrors.farmerName ? (
                        <p className="font-manrope text-sm text-red-600">
                          {" "}
                          {fieldErrors.farmerName}{" "}
                        </p>
                      ) : null}{" "}
                    </div>{" "}
                    <div className="space-y-2">
                      {" "}
                      <label className="font-manrope type-nav text-slate-800">
                        {" "}
                        {isTe ? "Aadhaar సంఖ్య" : "Aadhaar number"}{" "}
                        {farmerType === "NEW" ? (
                          <span className="ml-1 text-rose-500">*</span>
                        ) : (
                          <span className="ml-1 text-slate-400">
                            (optional)
                          </span>
                        )}{" "}
                      </label>{" "}
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
                        aria-invalid={Boolean(fieldErrors.aadhaar)}
                        className={
                          fieldErrors.aadhaar
                            ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-100"
                            : ""
                        }
                      />{" "}
                      {fieldErrors.aadhaar ? (
                        <p className="font-manrope text-sm text-red-600">
                          {" "}
                          {fieldErrors.aadhaar}{" "}
                        </p>
                      ) : null}{" "}
                    </div>{" "}
                    <div className="space-y-2">
                      {" "}
                      <label className="font-manrope type-nav text-slate-800">
                        {" "}
                        {isTe ? "Mobile number" : "Mobile number"}{" "}
                        <span className="text-red-500">*</span>{" "}
                      </label>{" "}
                      <Input
                        placeholder={
                          isTe
                            ? "Mobile number నమోదు చేయండి"
                            : "Enter mobile number"
                        }
                        inputMode="tel"
                        maxLength={10}
                        value={form.mobileNumber}
                        onChange={handleChange("mobileNumber")}
                        ref={mobileInputRef}
                        aria-invalid={Boolean(fieldErrors.mobileNumber)}
                        className={
                          fieldErrors.mobileNumber
                            ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-100"
                            : ""
                        }
                      />{" "}
                      {fieldErrors.mobileNumber ? (
                        <p className="font-manrope text-sm text-red-600">
                          {" "}
                          {fieldErrors.mobileNumber}{" "}
                        </p>
                      ) : null}{" "}
                    </div>{" "}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <label className="font-manrope type-nav text-slate-800">
                          {" "}
                          {isTe ? "?????" : "Mandal"}{" "}
                          <span className="text-red-500">*</span>{" "}
                        </label>{" "}
                        <button
                          type="button"
                          onClick={openMandalModal}
                          className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[0.72rem] font-black uppercase tracking-[0.18em] text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100"
                        >
                          {" "}
                          <Plus className="h-3.5 w-3.5" /> Add{" "}
                        </button>{" "}
                      </div>{" "}
                      <div
                        ref={mandalDropdownRef}
                        className="relative space-y-2"
                      >
                        {" "}
                        <Input
                          ref={mandalInputRef}
                          placeholder={
                            isTe
                              ? "3 అక్షరాలు టైప్ చేయండి"
                              : "Type 3 or more letters"
                          }
                          value={form.mandal}
                          onChange={handleChange("mandal")}
                          onKeyDown={handleMandalKeyDown}
                          onFocus={() => setHideMandalSuggestions(false)}
                          required
                          aria-invalid={Boolean(fieldErrors.mandal)}
                          className={
                            fieldErrors.mandal
                              ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-100"
                              : ""
                          }
                        />{" "}
                        {String(form.mandal || "").trim().length >= 3 &&
                        !hideMandalSuggestions ? (
                          <div className="absolute left-0 top-full z-20 mt-2 max-h-56 w-full overflow-auto rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                            {" "}
                            {mandalSearchLoading ? (
                              <div className="px-4 py-3 font-manrope text-sm text-slate-500">
                                {" "}
                                {isTe
                                  ? "మండలాలు వెతుకుతోంది..."
                                  : "Searching mandals..."}{" "}
                              </div>
                            ) : mandalOptions.length ? (
                              mandalOptions.map((mandal, index) => (
                                <button
                                  key={mandal.id}
                                  type="button"
                                  onMouseDown={(event) =>
                                    event.preventDefault()
                                  }
                                  onClick={() => chooseMandal(mandal)}
                                  className={[
                                    "flex w-full flex-col items-start gap-1 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-emerald-50",
                                    mandalActiveIndex === index
                                      ? "bg-emerald-50"
                                      : "",
                                  ].join(" ")}
                                >
                                  {" "}
                                  <span className="font-manrope text-sm font-semibold text-slate-900">
                                    {" "}
                                    {mandal.name}{" "}
                                  </span>{" "}
                                  <span className="font-manrope text-xs text-slate-500">
                                    {" "}
                                    {[mandal.districtName, mandal.stateName]
                                      .filter(Boolean)
                                      .join(", ")}{" "}
                                  </span>{" "}
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-3 font-manrope text-sm text-slate-500">
                                {" "}
                                {isTe
                                  ? "మండలం కనపడలేదు."
                                  : "No matching mandal found."}{" "}
                              </div>
                            )}{" "}
                          </div>
                        ) : null}{" "}
                        {fieldErrors.mandal ? (
                          <p className="font-manrope text-sm text-red-600">
                            {" "}
                            {fieldErrors.mandal}{" "}
                          </p>
                        ) : null}{" "}
                      </div>{" "}
                    </div>{" "}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <label className="font-manrope type-nav text-slate-800">
                          {" "}
                          {isTe ? "గ్రామం" : "Village"}{" "}
                          <span className="text-red-500">*</span>{" "}
                        </label>{" "}
                        <button
                          type="button"
                          onClick={openVillageModal}
                          className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[0.72rem] font-black uppercase tracking-[0.18em] text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100"
                        >
                          {" "}
                          <Plus className="h-3.5 w-3.5" /> Add{" "}
                        </button>{" "}
                      </div>{" "}
                      <div
                        ref={villageDropdownRef}
                        className="relative space-y-2"
                      >
                        {" "}
                        <Input
                          ref={villageInputRef}
                          placeholder={
                            form.mandalId
                              ? isTe
                                ? "గ్రామం టైప్ చేయండి లేదా ఎంపిక చేయండి"
                                : "Type or choose a village"
                              : isTe
                                ? "ముందు మండలం ఎంచుకోండి"
                                : "Select a mandal first"
                          }
                          value={form.village}
                          onChange={handleChange("village")}
                          onKeyDown={handleVillageKeyDown}
                          onFocus={() => {
                            if (!form.mandalId) return;
                            if (form.village.trim().length >= 2) {
                              setHideVillageSuggestions(false);
                            }
                          }}
                          disabled={!form.mandalId}
                          required
                          aria-invalid={Boolean(fieldErrors.village)}
                          className={[
                            fieldErrors.village
                              ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-100"
                              : "",
                            !form.mandalId
                              ? "cursor-not-allowed bg-slate-50"
                              : "",
                          ].join(" ")}
                        />{" "}
                        {form.mandalId &&
                        form.village.trim().length >= 2 &&
                        !hideVillageSuggestions ? (
                          <div className="absolute left-0 top-full z-20 mt-2 max-h-56 w-full overflow-auto rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                            {" "}
                            {villageSearchLoading ? (
                              <div className="px-4 py-3 font-manrope text-sm text-slate-500">
                                {" "}
                                {isTe
                                  ? "గ్రామాలు వెతుకుతోంది..."
                                  : "Searching villages..."}{" "}
                              </div>
                            ) : villageOptions.length ? (
                              villageOptions.map((village, index) => (
                                <button
                                  key={village.id}
                                  type="button"
                                  onMouseDown={(event) =>
                                    event.preventDefault()
                                  }
                                  onClick={() => chooseVillage(village)}
                                  className={[
                                    "flex w-full flex-col items-start gap-1 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-emerald-50",
                                    villageActiveIndex === index
                                      ? "bg-emerald-50"
                                      : "",
                                  ].join(" ")}
                                >
                                  {" "}
                                  <span className="font-manrope text-sm font-semibold text-slate-900">
                                    {" "}
                                    {village.name}{" "}
                                  </span>{" "}
                                  <span className="font-manrope text-xs text-slate-500">
                                    {" "}
                                    {village.mandalName || form.mandal}{" "}
                                  </span>{" "}
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-3 font-manrope text-sm text-slate-500">
                                {" "}
                                {isTe
                                  ? "గ్రామాలు కనపడలేదు."
                                  : "No matching village found."}{" "}
                              </div>
                            )}{" "}
                          </div>
                        ) : null}{" "}
                      </div>{" "}
                      {fieldErrors.village ? (
                        <p className="font-manrope text-sm text-red-600">
                          {" "}
                          {fieldErrors.village}{" "}
                        </p>
                      ) : null}{" "}
                    </div>{" "}
                    <div className="space-y-2">
                      {" "}
                      <label className="font-manrope type-nav text-slate-800">
                        {" "}
                        {isTe ? (
                          <>
                            {" "}
                            చిరునామా{" "}
                            <span className="text-slate-400">
                              (ఐచ్ఛికం)
                            </span>{" "}
                          </>
                        ) : (
                          <>
                            {" "}
                            Address{" "}
                            <span className="text-slate-400">
                              (optional)
                            </span>{" "}
                          </>
                        )}{" "}
                      </label>{" "}
                      <Input
                        placeholder={
                          isTe
                            ? "ఐచ్ఛిక చిరునామాను నమోదు చేయండి"
                            : "Enter optional address"
                        }
                        value={form.address}
                        onChange={handleChange("address")}
                      />{" "}
                    </div>{" "}
                    {farmerType === "OLD" ? (
                      <div className="md:col-span-2 lg:col-span-3">
                        <label className="block font-manrope type-nav text-slate-800">
                          Proof image
                        </label>
                        <label className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[22px] border border-dashed border-emerald-200 bg-emerald-50/40 px-4 py-5 text-center transition hover:border-[rgb(4,120,87)] hover:bg-emerald-50">
                          {oldFarmerProofImage ? (
                            <img
                              src={oldFarmerProofImage}
                              alt="Selected proof preview"
                              className="max-h-44 w-full rounded-2xl object-contain"
                            />
                          ) : (
                            <>
                              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-[rgb(4,120,87)] shadow-sm">
                                <ImagePlus className="h-5 w-5" />
                              </span>
                              <span className="font-manrope text-sm font-semibold text-slate-800">
                                Select one image proof
                              </span>
                              <span className="font-manrope text-xs text-slate-500">
                                JPG, JPEG, or PNG will be converted to WebP.
                              </span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp"
                            className="sr-only"
                            onChange={handleOldFarmerProofChange}
                          />
                        </label>
                        {oldFarmerProofImage ? (
                          <button
                            type="button"
                            onClick={() => {
                              setOldFarmerProofImage("");
                              setOldFarmerProofError("");
                            }}
                            className="mt-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
                          >
                            Remove selected image
                          </button>
                        ) : null}
                        {oldFarmerProofError ? (
                          <p className="mt-2 font-manrope text-sm text-red-600">
                            {oldFarmerProofError}
                          </p>
                        ) : null}
                      </div>
                    ) : null}{" "}
                    {farmerType === "NEW" ? (
                      <div className="md:col-span-2 lg:col-span-3">
                        {" "}
                        <div className="grid gap-3 sm:grid-cols-3">
                          {" "}
                          {statusOptions.map((option) =>
                            (() => {
                              const isSelected =
                                selectedStatus === option.value;
                              const activeStyles =
                                option.value === "GREEN"
                                  ? "border-emerald-300 bg-emerald-50/90 text-emerald-950 shadow-[0_12px_30px_rgba(16,185,129,0.12)]"
                                  : option.value === "YELLOW"
                                    ? "border-amber-300 bg-amber-50/90 text-amber-950 shadow-[0_12px_30px_rgba(245,158,11,0.12)]"
                                    : "border-red-300 bg-red-50/90 text-red-950 shadow-[0_12px_30px_rgba(239,68,68,0.12)]";
                              const inactiveStyles =
                                "border-border bg-slate-50 text-slate-700 hover:bg-slate-100";
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
                                  onClick={() =>
                                    setSelectedStatus(option.value)
                                  }
                                  className={[
                                    "rounded-2xl border px-4 py-4 text-left transition duration-200",
                                    isSelected ? activeStyles : inactiveStyles,
                                  ].join(" ")}
                                >
                                  {" "}
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
                                    {" "}
                                    {option.label}{" "}
                                  </p>{" "}
                                  <p
                                    className={[
                                      "mt-1 font-manrope type-small",
                                      isSelected
                                        ? selectedHelper
                                        : "text-slate-500",
                                    ].join(" ")}
                                  >
                                    {" "}
                                    {option.helper}{" "}
                                  </p>{" "}
                                </button>
                              );
                            })(),
                          )}{" "}
                        </div>{" "}
                      </div>
                    ) : null}{" "}
                  </div>{" "}
                  <div className="mt-8 flex justify-end">
                    {" "}
                    <Button
                      className="w-full !bg-[rgb(4,120,87)] !text-white hover:!bg-[rgb(4,120,87)] hover:brightness-105 sm:w-auto sm:min-w-[280px] lg:min-w-[320px]"
                      size="lg"
                      type="submit"
                      disabled={isSubmitting || isChecking}
                    >
                      {" "}
                      {isSubmitting
                        ? isTe
                          ? "సేవ్ చేస్తోంది..."
                          : "Saving..."
                        : isTe
                          ? "రైతు status జోడించండి"
                          : "Add farmer record"}{" "}
                    </Button>{" "}
                  </div>{" "}
                  {error ? (
                    <p className="font-manrope type-small text-red-600">
                      {" "}
                      {error}{" "}
                    </p>
                  ) : null}{" "}
                  {message ? (
                    <p className="font-manrope type-small text-emerald-700">
                      {" "}
                      {message}{" "}
                    </p>
                  ) : null}{" "}
                </form>{" "}
                <div className="space-y-5 border-t border-slate-200 pt-6">
                  {" "}
                  <div className="flex items-center justify-between">
                    {" "}
                    <div>
                      {" "}
                      <p className="font-manrope type-small uppercase tracking-[0.2em] text-[rgb(4,120,87)]">
                        {" "}
                        {isTe ? "సహాయం" : "Help"}{" "}
                      </p>{" "}
                      <h2 className="mt-1 font-manrope type-card text-slate-900">
                        {" "}
                        {isTe
                          ? "సులభమైన రికార్డు నమోదు నియమాలు"
                          : "Old and New Farmer rules"}{" "}
                      </h2>{" "}
                    </div>{" "}
                  </div>{" "}
                  <p className="font-manrope type-body leading-7 text-slate-600">
                    {" "}
                    {isTe
                      ? "ఇక్కడ PAN అవసరం లేదు. Aadhaar, mobile, mandal, మరియు village వాడండి."
                      : "Use Old Farmer when the farmer should be part of the shared dealer records. Use New Farmer when you are creating your own dealer-only reputation record."}{" "}
                  </p>{" "}
                  <ul className="space-y-3 border-t border-slate-100 pt-4 font-manrope type-body text-slate-600">
                    {" "}
                    <li className="flex gap-2">
                      {" "}
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[rgb(4,120,87)]" />{" "}
                      <span>
                        {" "}
                        {isTe
                          ? "పాటర్న్‌ను నిర్ధారించడానికి ఇతర డీలర్లు ఒక్కసారి ఓటు వేయగలరు."
                          : "Old Farmer records are public and require one proof image before saving or voting."}{" "}
                      </span>{" "}
                    </li>{" "}
                    <li className="flex gap-2">
                      {" "}
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[rgb(4,120,87)]" />{" "}
                      <span>
                        {" "}
                        {isTe
                          ? "Admin తప్పు లేదా వివాదాస్పద రికార్డులను తొలగించగలరు."
                          : "New Farmer records are private to your dealer account and Aadhaar is mandatory."}{" "}
                      </span>{" "}
                    </li>{" "}
                    <li className="flex gap-2">
                      {" "}
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[rgb(4,120,87)]" />{" "}
                      <span>
                        {" "}
                        {isTe
                          ? "GREEN, YELLOW, మరియు RED status ఒకే record flow‌లో చూపబడతాయి."
                          : "Status selection is used only for New Farmer records: GREEN, YELLOW, or RED."}{" "}
                      </span>{" "}
                    </li>{" "}
                    <li className="flex gap-2">
                      {" "}
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[rgb(4,120,87)]" />{" "}
                      <span>
                        {" "}
                        {isTe
                          ? "Duplicate check mobile number ఆధారంగా జరుగుతుంది, ఎందుకంటే Aadhaar optional."
                          : "Old Farmer duplicate check uses mobile number. New Farmer duplicate check uses Aadhaar."}{" "}
                      </span>{" "}
                    </li>{" "}
                  </ul>{" "}
                </div>{" "}
              </div>{" "}
            </CardContent>{" "}
          </Card>{" "}
        </motion.div>{" "}
      </section>{" "}
      {existingFarmerModalOpen && existingFarmerRecord ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-950/45 px-4 py-4 backdrop-blur-[2px] sm:py-6"
          onClick={closeExistingFarmerModal}
        >
          <div
            className="flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_28px_80px_rgba(15,23,42,0.22)] sm:max-h-[calc(100vh-3rem)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 px-6 py-5">
              <div>
                <p className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-emerald-700">
                  {isTe ? "???? ???? ???????" : "Existing farmer details"}
                </p>
                <h2 className="mt-1 font-manrope text-xl font-extrabold tracking-[-0.04em] text-slate-950">
                  {existingFarmerRecord.farmerName}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeExistingFarmerModal}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 sm:border-slate-200 sm:text-slate-600 sm:shadow-none"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto px-6 py-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-slate-500">
                    {isTe ? "???? ????" : "Farmer name"}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">
                    {existingFarmerRecord.farmerName}
                  </p>
                </div>
                <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-slate-500">
                    {isTe ? "??????" : "Mobile"}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">
                    {existingFarmerRecord.mobileNumber || "-"}
                  </p>
                </div>
                <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-slate-500">
                    {isTe ? "?????" : "Aadhaar"}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">
                    {existingFarmerRecord.aadhaarMasked || "-"}
                  </p>
                </div>
                <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-slate-500">
                    {isTe ? "???????" : "Location"}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">
                    {existingFarmerRecord.village},{" "}
                    {existingFarmerRecord.mandal}
                  </p>
                </div>
                {String(existingFarmerRecord.farmerType || "").toUpperCase() !==
                "OLD" ? (
                  <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-slate-500">
                      {isTe ? "??????" : "Status"}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {existingFarmerRecord.statusColor}
                    </p>
                  </div>
                ) : null}
                <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-slate-500">
                    {isTe ? "??????" : "District"}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">
                    {existingFarmerRecord.district}
                  </p>
                </div>
              </div>

              {String(existingFarmerRecord.farmerType || "").toUpperCase() ===
              "NEW" ? (
                existingFarmerDuplicatePolicy?.sameDealerExists ||
                (activeDealerId &&
                  Number(existingFarmerRecord.createdByDealerId || 0) ===
                    Number(activeDealerId)) ? (
                  <div className="rounded-[20px] border border-amber-200 bg-amber-50/80 px-4 py-4">
                    <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-amber-700">
                      {isTe
                        ? "???? ???????? ? ?????? ???????????"
                        : "You already created this farmer"}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-amber-950">
                      {isTe
                        ? "? Aadhaar ?? ?? ????? ?????? ???????? ???????? ????."
                        : "This Aadhaar already exists in your dealer account."}
                    </p>
                  </div>
                ) : existingFarmerDuplicatePolicy?.hasBlockingStatus ? (
                  <div className="rounded-[20px] border border-red-200 bg-red-50/80 px-4 py-4">
                    <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-red-700">
                      {isTe
                        ? "?????? ?????? ???????????"
                        : "Create is not allowed"}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-red-950">
                      {isTe
                        ? "? Aadhaar ?? YELLOW ???? RED ?????? ???????? ?????."
                        : "This Aadhaar already has a Yellow or Red status from another dealer."}
                    </p>
                  </div>
                ) : existingFarmerRecord.statusColor === "GREEN" &&
                  existingFarmerDuplicatePolicy?.canCreateNewForDealer !==
                    false ? (
                  <div className="space-y-4">
                    <div className="rounded-[20px] border border-emerald-200 bg-emerald-50/60 px-4 py-4">
                      <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-emerald-700">
                        {isTe ? "?????? ??????" : "Choose status to create"}
                      </p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-3">
                        {statusOptions.map((option) => {
                          const isSelected = selectedStatus === option.value;
                          const selectedClass =
                            option.value === "GREEN"
                              ? "border-emerald-300 bg-emerald-600 text-white"
                              : option.value === "YELLOW"
                                ? "border-amber-300 bg-amber-400 text-white"
                                : "border-red-300 bg-red-500 text-white";

                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setSelectedStatus(option.value)}
                              className={[
                                "rounded-full border px-3 py-2 text-center text-xs font-black uppercase tracking-[0.14em] transition",
                                isSelected
                                  ? selectedClass
                                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                              ].join(" ")}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        onClick={handleExistingFarmerCreate}
                        disabled={existingFarmerVoting}
                        className="min-w-[180px] rounded-full !bg-[rgb(4,120,87)] !text-white hover:!bg-[rgb(4,120,87)] hover:brightness-105"
                      >
                        {existingFarmerVoting
                          ? isTe
                            ? "?????????????..."
                            : "Creating..."
                          : isTe
                            ? "?????????"
                            : "Create"}
                      </Button>
                    </div>
                  </div>
                ) : null
              ) : (
                <>
                  {existingFarmerRecord.currentDealerCountAction ===
                  "INCREMENT" ? (
                    <div className="rounded-[20px] border border-emerald-200 bg-emerald-50/80 px-4 py-4">
                      <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-emerald-700">
                        {isTe
                          ? "???? ???????? ??? ??????"
                          : "You already voted"}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-emerald-950">
                        {isTe
                          ? "? ?????? ?? ??? ???????? ????? ????????."
                          : "You have already voted for this farmer."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block font-manrope text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                          Proof image
                        </label>
                        <label className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[22px] border border-dashed border-emerald-200 bg-emerald-50/40 px-4 py-5 text-center transition hover:border-[rgb(4,120,87)] hover:bg-emerald-50">
                          {oldFarmerProofImage ? (
                            <img
                              src={oldFarmerProofImage}
                              alt="Selected proof preview"
                              className="max-h-52 w-full rounded-2xl object-contain"
                            />
                          ) : (
                            <>
                              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-[rgb(4,120,87)] shadow-sm">
                                <ImagePlus className="h-5 w-5" />
                              </span>
                              <span className="font-manrope text-sm font-semibold text-slate-800">
                                Select one image proof
                              </span>
                              <span className="font-manrope text-xs text-slate-500">
                                JPG, JPEG, PNG, or WebP will be saved as WebP.
                              </span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp"
                            className="sr-only"
                            onChange={handleOldFarmerProofChange}
                          />
                        </label>
                        {oldFarmerProofImage ? (
                          <button
                            type="button"
                            onClick={() => {
                              setOldFarmerProofImage("");
                              setOldFarmerProofError("");
                            }}
                            className="mt-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
                          >
                            Remove selected image
                          </button>
                        ) : null}
                        {oldFarmerProofError ? (
                          <p className="mt-2 font-manrope text-sm text-red-600">
                            {oldFarmerProofError}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          onClick={handleExistingFarmerVote}
                          disabled={
                            existingFarmerVoting || !oldFarmerProofImage
                          }
                          className="min-w-[180px] rounded-full !bg-[rgb(4,120,87)] !text-white hover:!bg-[rgb(4,120,87)] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {existingFarmerVoting
                            ? isTe
                              ? "??? ?????????..."
                              : "Voting..."
                            : isTe
                              ? "??? ??????"
                              : "Vote"}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
      {locationModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-[2px]"
          onClick={closeLocationModal}
        >
          {" "}
          <div
            className="w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-[0_28px_80px_rgba(15,23,42,0.22)]"
            onClick={(event) => event.stopPropagation()}
          >
            {" "}
            <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 px-6 py-5">
              {" "}
              <div>
                {" "}
                <p className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-emerald-700">
                  {" "}
                  {locationModal === "mandal"
                    ? "Add Mandal"
                    : "Add Village"}{" "}
                </p>{" "}
                <h2 className="mt-1 font-manrope text-xl font-extrabold tracking-[-0.04em] text-slate-950">
                  {" "}
                  {locationModal === "mandal"
                    ? "Create a mandal under an existing district"
                    : "Create a village under the selected mandal"}{" "}
                </h2>{" "}
              </div>{" "}
              <button
                type="button"
                onClick={closeLocationModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                aria-label="Close modal"
              >
                {" "}
                <X className="h-4 w-4" />{" "}
              </button>{" "}
            </div>{" "}
            <div className="space-y-5 px-6 py-6">
              {" "}
              {locationModal === "mandal" ? (
                <>
                  {" "}
                  <div className="relative space-y-2">
                    {" "}
                    <label className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-slate-500">
                      {" "}
                      District{" "}
                    </label>{" "}
                    <Input
                      value={districtQuery}
                      onChange={(event) => {
                        setSelectedDistrict(null);
                        setDistrictQuery(event.target.value);
                        setShowDistrictOptions(true);
                      }}
                      onKeyDown={handleDistrictKeyDown}
                      placeholder="Type district name"
                      className="h-12 rounded-full border border-slate-200 bg-white shadow-none focus:border-[rgb(4,120,87)]"
                    />{" "}
                    {showDistrictOptions && districtQuery.trim().length >= 2 ? (
                      <div className="absolute left-0 top-full z-20 mt-2 max-h-56 w-full overflow-auto rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                        {" "}
                        {districtSearchLoading ? (
                          <div className="px-4 py-3 text-sm text-slate-500">
                            {" "}
                            Searching districts...{" "}
                          </div>
                        ) : districtOptions.length ? (
                          districtOptions.map((district, index) => (
                            <button
                              key={district.id}
                              type="button"
                              onClick={() => chooseDistrict(district)}
                              className={[
                                "flex w-full flex-col items-start gap-1 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-emerald-50",
                                index === districtActiveIndex
                                  ? "bg-emerald-50"
                                  : "",
                              ].join(" ")}
                            >
                              {" "}
                              <span className="font-manrope text-sm font-semibold text-slate-900">
                                {" "}
                                {district.name}{" "}
                              </span>{" "}
                              <span className="text-[0.68rem] font-medium text-slate-500">
                                {" "}
                                {district.stateName || "-"}{" "}
                              </span>{" "}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-slate-500">
                            {" "}
                            No matching district found.{" "}
                          </div>
                        )}{" "}
                      </div>
                    ) : null}{" "}
                  </div>{" "}
                  <div className="space-y-2">
                    {" "}
                    <label className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-slate-500">
                      {" "}
                      Mandal name{" "}
                    </label>{" "}
                    <Input
                      value={pendingLocationName}
                      onChange={(event) =>
                        setPendingLocationName(event.target.value)
                      }
                      placeholder="Enter mandal name"
                      className="h-12 w-full rounded-full border border-slate-200 bg-white shadow-none focus:border-[rgb(4,120,87)]"
                    />{" "}
                  </div>{" "}
                </>
              ) : null}{" "}
              {locationModal === "village" ? (
                <>
                  {" "}
                  <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                    {" "}
                    <p className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-slate-500">
                      {" "}
                      Selected mandal{" "}
                    </p>{" "}
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {" "}
                      {selectedMandal?.name || form.mandal}{" "}
                    </p>{" "}
                    <p className="mt-0.5 text-sm text-slate-600">
                      {" "}
                      {selectedMandal?.districtName ||
                        form.district ||
                        "-"}{" "}
                      district, {selectedMandal?.stateName || "-"}{" "}
                    </p>{" "}
                  </div>{" "}
                  <div className="space-y-2">
                    {" "}
                    <label className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-slate-500">
                      {" "}
                      Village name{" "}
                    </label>{" "}
                    <Input
                      value={pendingLocationName}
                      onChange={(event) =>
                        setPendingLocationName(event.target.value)
                      }
                      placeholder="Enter village name"
                      className="h-12 w-full rounded-full border border-slate-200 bg-white shadow-none focus:border-[rgb(4,120,87)]"
                    />{" "}
                  </div>{" "}
                </>
              ) : null}{" "}
              <div className="flex flex-col gap-3 border-t border-slate-200/80 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                {" "}
                <p className="text-sm text-slate-600">
                  {" "}
                  {locationModal === "mandal"
                    ? "District is required. Mandal name is required."
                    : "Mandal is already selected. Village name is required."}{" "}
                </p>{" "}
                <div className="flex w-full items-center justify-end gap-3 sm:w-auto">
                  {" "}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeLocationModal}
                    className="rounded-full"
                    disabled={savingLocation}
                  >
                    {" "}
                    Cancel{" "}
                  </Button>{" "}
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
                    {" "}
                    {savingLocation ? "Saving..." : "Save"}{" "}
                  </Button>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>
      ) : null}{" "}
      <KyfiToast
        open={toast.open}
        message={toast.message}
        tone={toast.tone}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
      />{" "}
        <Footer />{" "}
      </main>
    </AuthGuard>
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
      {" "}
      <p className="font-manrope type-small text-slate-500">{label}</p>{" "}
      <div className="mt-1 flex items-center gap-2">
        {" "}
        {badge}{" "}
        <p className="font-manrope type-nav text-slate-900">{value}</p>{" "}
      </div>{" "}
    </div>
  );
}
