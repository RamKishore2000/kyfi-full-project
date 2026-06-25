"use client";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { motion } from "framer-motion";
import {
  ChevronDown,
  Plus,
  Fingerprint,
  Loader2,
  MapPin,
  Phone,
  Search,
  X,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KyfiToast } from "@/components/kyfi/kyfi-toast";
import { OldFarmerProofPicker } from "@/components/kyfi/old-farmer-proof-picker";
import { useKyfiLanguage } from "@/components/kyfi/language-provider";
import {
  createMandal,
  createVillage,
  searchDistricts,
  searchMandals,
  searchVillages,
  type DistrictSearchResult,
  type MandalSearchResult,
  type VillageSearchResult,
} from "@/lib/api/locations";
import { searchFarmerStatuses } from "@/lib/api/farmer-status-search";
import {
  checkFarmerStatus,
  decrementFarmerStatusCount,
  fetchFarmerStatusVoters,
  incrementFarmerStatusCount,
  moveFarmerStatusToOld,
  voteFarmerStatus,
  type FarmerStatusColor,
  type FarmerStatusVoteVoter,
} from "@/lib/api/farmer-status";
import type { FarmerStatusRecord } from "@/lib/api/farmer-status";
import { KYFI_API_BASE_URL } from "@/lib/config";
import { imageFileToWebpDataUrl } from "@/lib/image-proof";

const SEARCH_PROOF_SESSION_KEY = "kyfi_search_proof_session";
const SEARCH_PROOF_SESSION_TTL_MS = 3 * 60 * 1000;

const formatMandalSuggestion = (mandal: MandalSearchResult) =>
  `${mandal.name} mandal, ${mandal.districtName || "-"} district, ${mandal.stateName || "-"}`;
function maskAadhaar(value: string | null | undefined) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length >= 4
    ? `XXXX XXXX ${digits.slice(-4)}`
    : "XXXX XXXX XXXX";
}
function buildAssetUrl(path: string | null | undefined) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${KYFI_API_BASE_URL.replace(/\/api$/, "")}${path}`;
}
function VoteProofImage({ src }: { src: string | null | undefined }) {
  const [failed, setFailed] = useState(false);
  const imageSrc = buildAssetUrl(src);

  if (!imageSrc || failed) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl bg-white text-center text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        No proof image
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt="Vote proof"
      className="h-32 w-full rounded-xl object-cover"
      onError={() => setFailed(true)}
    />
  );
}
function getStatusBadge({
  farmer,
  t,
}: {
  farmer: FarmerStatusRecord;
  t: ReturnType<typeof useKyfiLanguage>["t"];
}) {
  if (farmer.farmerType === "NEW") {
    const activeColor = String(
      farmer.currentDealerVoteColor || "",
    ).toUpperCase();
    if (!activeColor) {
      return {
        label: t("search.statusNotVoted"),
        className:
          "rounded-full border-slate-200 bg-slate-100 px-3 py-1.5 text-slate-700",
      };
    }
    if (activeColor === "GREEN") {
      return {
        label: "GREEN",
        className:
          "rounded-full border-emerald-200 bg-emerald-100 px-3 py-1.5 text-emerald-700",
      };
    }
    if (activeColor === "YELLOW") {
      return {
        label: "YELLOW",
        className:
          "rounded-full border-yellow-200 bg-yellow-50 px-3 py-1.5 text-yellow-700",
      };
    }
    if (activeColor === "RED") {
      return {
        label: "RED",
        className:
          "rounded-full border-red-200 bg-red-100 px-3 py-1.5 text-red-700",
      };
    }
  }
  const statusColor = String(farmer.statusColor || "").toUpperCase();
  if (statusColor === "GREEN") {
    return {
      label: "GREEN",
      className:
        "rounded-full border-emerald-200 bg-emerald-100 px-3 py-1.5 text-emerald-700",
    };
  }
  if (statusColor === "YELLOW") {
    return {
      label: "YELLOW",
      className:
        "rounded-full border-yellow-200 bg-yellow-50 px-3 py-1.5 text-yellow-700",
    };
  }
  if (statusColor === "RED") {
    return {
      label: "RED",
      className:
        "rounded-full border-red-200 bg-red-100 px-3 py-1.5 text-red-700",
    };
  }
  return {
    label: t("search.statusNotVoted"),
    className:
      "rounded-full border-slate-200 bg-slate-100 px-3 py-1.5 text-slate-700",
  };
}
function formatDate(date: Date, language: "en" | "te") {
  return new Intl.DateTimeFormat(language === "te" ? "te-IN" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatVotedDate(value: string, language: "en" | "te") {
  const localTimestamp = value.match(
    /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})/,
  );
  const date = localTimestamp
    ? new Date(
        Number(localTimestamp[1]),
        Number(localTimestamp[2]) - 1,
        Number(localTimestamp[3]),
        Number(localTimestamp[4]),
        Number(localTimestamp[5]),
        Number(localTimestamp[6]),
      )
    : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(language === "te" ? "te-IN" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getVoteColorBadgeClass(voteColor: FarmerStatusVoteVoter["voteColor"]) {
  const normalized = String(voteColor || "").toUpperCase();
  if (normalized === "GREEN") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (normalized === "YELLOW") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (normalized === "RED") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-slate-200 bg-slate-100 text-slate-600";
}
function FarmerStatusCard({
  farmer,
  language,
  t,
  actionStatusId,
  onVote,
  onIncrement,
  onDecrement,
  onMoveToOld,
  onViewVotes,
}: {
  farmer: FarmerStatusRecord;
  language: "en" | "te";
  t: ReturnType<typeof useKyfiLanguage>["t"];
  actionStatusId: number | null;
  onVote: (statusId: number, voteColor: FarmerStatusColor) => void;
  onIncrement: (statusId: number) => void;
  onDecrement: (statusId: number) => void;
  onMoveToOld: (statusId: number) => void;
  onViewVotes: (statusId: number, farmerName: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isActing = actionStatusId === farmer.id;
  const canIncrement = farmer.canIncrement !== false;
  const canDecrement = farmer.canDecrement === true;
  const canManageStatus = farmer.canManageStatus !== false;
  const canMoveToOld = farmer.canMoveToOld !== false;
  const hideCountControls =
    farmer.farmerType !== "NEW" && farmer.statusColor === "GREEN";
  const rowGridClass = hideCountControls
    ? "grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_auto] xl:grid-cols-[minmax(180px,1.15fr)_minmax(180px,1fr)_minmax(180px,1fr)_auto_auto] xl:items-center"
    : "grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_auto] xl:grid-cols-[minmax(180px,1.15fr)_minmax(180px,1fr)_minmax(180px,1fr)_minmax(220px,1.08fr)_auto] xl:items-center";
  const statusBadge = getStatusBadge({ farmer, t });
  const shouldShowStatusBadge =
    farmer.farmerType !== "OLD" ||
    statusBadge.label !== t("search.statusNotVoted");
  const activeVoteColor = farmer.currentDealerVoteColor ?? null;

  return (
    <article className="border border-slate-200/80 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.06)] max-sm:overflow-hidden max-sm:rounded-[22px] max-sm:shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
      <div className="px-4 py-4 sm:px-6 sm:py-5 max-sm:px-3 max-sm:py-3">
        <div className="space-y-4 max-sm:space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between max-sm:gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-manrope text-[1rem] font-extrabold tracking-[-0.04em] text-slate-950 sm:text-[1.15rem]">
                {farmer.farmerName}
              </p>
              <Badge
                variant={farmer.farmerType === "NEW" ? "secondary" : "outline"}
                className="rounded-full px-3 py-0.5 text-[0.68rem] font-bold tracking-[0.12em]"
              >
                {farmer.farmerType === "NEW"
                  ? t("search.farmerTypeNew")
                  : t("search.farmerTypeOld")}
              </Badge>
              {shouldShowStatusBadge ? (
                <Badge
                  variant="outline"
                  className={[
                    statusBadge.className,
                    "rounded-full px-3 py-0.5 text-[0.68rem] font-bold tracking-[0.12em]",
                  ].join(" ")}
                >
                  {statusBadge.label}
                </Badge>
              ) : null}
            </div>
            {farmer.farmerType === "NEW" ? (
              <button
                type="button"
                onClick={() => onMoveToOld(farmer.id)}
                disabled={isActing || !canMoveToOld}
                className="inline-flex h-10 items-center justify-center rounded-full border border-amber-300 bg-amber-50 px-4 text-[0.68rem] font-black uppercase tracking-[0.18em] text-amber-700 transition hover:border-amber-400 hover:bg-amber-100 hover:text-amber-800 disabled:cursor-not-allowed disabled:opacity-40 sm:self-start max-sm:h-9 max-sm:px-3 max-sm:text-[0.62rem]"
                aria-label="Move to old"
              >
                Move to Old
              </button>
            ) : null}
          </div>

          <div className={rowGridClass}>
            <InfoCard
              icon={MapPin}
              label={t("search.district")}
              value={farmer.district || "-"}
              className="h-full sm:hidden max-sm:rounded-[14px] max-sm:px-2 max-sm:py-2"
            />
            <InfoCard
              icon={MapPin}
              label={t("search.location")}
              value={`${farmer.village}, ${farmer.mandal}`}
              className="h-full max-sm:hidden"
            />
            <InfoCard
              icon={MapPin}
              label={t("profile.mandal")}
              value={farmer.mandal || "-"}
              className="h-full sm:hidden max-sm:rounded-[14px] max-sm:px-2 max-sm:py-2"
            />
            <InfoCard
              icon={MapPin}
              label={t("profile.village")}
              value={farmer.village || "-"}
              className="h-full sm:hidden max-sm:rounded-[14px] max-sm:px-2 max-sm:py-2"
            />
            <InfoCard
              icon={Phone}
              label={t("myRecords.mobile")}
              value={farmer.mobileNumber || "-"}
              className="h-full max-sm:rounded-[14px] max-sm:px-2 max-sm:py-2"
            />
            <InfoCard
              icon={Fingerprint}
              label={t("search.maskedAadhaar")}
              value={maskAadhaar(farmer.aadhaar)}
              className="h-full max-sm:col-span-2 max-sm:rounded-[14px] max-sm:px-2 max-sm:py-2"
            />

            <div className="flex items-center self-center max-sm:col-span-2 max-sm:mt-0.5">
              {farmer.farmerType === "NEW" ? (
                <div className="grid min-h-[56px] w-full grid-cols-3 content-center gap-0.5 rounded-[22px] border border-slate-200 bg-slate-50 p-1 shadow-none max-sm:min-h-[50px] max-sm:rounded-[18px] max-sm:p-[3px]">
                  {(["GREEN", "YELLOW", "RED"] as FarmerStatusColor[]).map(
                    (voteColor) => {
                      const isActive = activeVoteColor === voteColor;
                      const colorClass =
                        voteColor === "GREEN"
                          ? isActive
                            ? "bg-emerald-500 text-white"
                            : "text-emerald-800 hover:bg-emerald-50"
                          : voteColor === "YELLOW"
                            ? isActive
                              ? "bg-amber-400 text-white"
                              : "text-emerald-800 hover:bg-emerald-50"
                            : isActive
                              ? "bg-rose-500 text-white"
                              : "text-emerald-800 hover:bg-emerald-50";
                      return (
                        <button
                          key={voteColor}
                          type="button"
                          onClick={() => onVote(farmer.id, voteColor)}
                          disabled={isActing || !canManageStatus}
                          className={[
                            "flex h-[34px] items-center justify-center rounded-[12px] px-1 py-0 text-[0.68rem] font-bold leading-none tracking-[0.04em] transition disabled:cursor-not-allowed disabled:opacity-40 max-sm:h-[30px] max-sm:text-[0.62rem]",
                            colorClass,
                          ].join(" ")}
                          aria-pressed={isActive}
                          aria-label={voteColor}
                        >
                          {voteColor}
                        </button>
                      );
                    },
                  )}
                </div>
              ) : hideCountControls ? null : (
                <div className="flex w-full flex-row items-center gap-2 max-sm:flex-col max-sm:items-stretch">
                  <div className="flex h-[56px] min-w-0 flex-1 items-center gap-2 rounded-[22px] border border-slate-200 bg-white px-3 py-2 shadow-[0_4px_14px_rgba(15,23,42,0.04)] max-sm:h-[50px] max-sm:rounded-[18px] max-sm:px-2.5 max-sm:py-1.5">
                    <button
                      type="button"
                      onClick={() => onDecrement(farmer.id)}
                      disabled={isActing || !canDecrement}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-100 bg-rose-50 text-sm font-bold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40 max-sm:h-8 max-sm:w-8"
                      aria-label={t("search.decrement")}
                    >
                      -
                    </button>
                    <div className="min-w-[4.5rem] flex-1 rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-1.5 text-center max-sm:px-2 max-sm:py-1">
                      <p className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-slate-500">
                        {t("search.votes")}
                      </p>
                      <p className="text-[0.95rem] font-extrabold leading-none text-slate-950 max-sm:text-[0.88rem]">
                        {farmer.voteCount}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onIncrement(farmer.id)}
                      disabled={isActing || !canIncrement}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-sm font-bold text-emerald-600 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40 max-sm:h-8 max-sm:w-8"
                      aria-label={t("search.increment")}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => onViewVotes(farmer.id, farmer.farmerName)}
                    className="inline-flex h-[56px] shrink-0 items-center justify-center rounded-[22px] border border-slate-200 bg-slate-50 px-3 text-[0.65rem] font-black uppercase tracking-[0.16em] text-slate-700 transition hover:border-[rgb(4,120,87)] hover:bg-emerald-50 hover:text-[rgb(4,120,87)] max-sm:h-9 max-sm:w-full max-sm:rounded-[18px] max-sm:px-3 max-sm:text-[0.62rem]"
                  >
                    View Votes
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end self-center max-sm:hidden">
              <button
                type="button"
                onClick={() => setExpanded((current) => !current)}
                className="inline-flex items-center justify-center border border-slate-200 bg-slate-50 p-2.5 text-sm font-semibold text-slate-700 transition hover:border-[rgb(4,120,87)] hover:text-[rgb(4,120,87)] max-sm:p-2"
                aria-expanded={expanded}
                aria-label={expanded ? "Hide details" : "Show details"}
              >
                <ChevronDown
                  className={[
                    "h-4 w-4 shrink-0 transition",
                    expanded ? "rotate-180" : "",
                  ].join(" ")}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
      {expanded ? (
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-4 sm:px-6 max-sm:hidden">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MiniInfo label={t("search.district")} value={farmer.district} />
            <MiniInfo
              label={t("profile.mandal")}
              value={farmer.mandal || "-"}
            />
            <MiniInfo label={t("profile.village")} value={farmer.village || "-"} />
            <MiniInfo
              label={t("search.maskedAadhaar")}
              value={maskAadhaar(farmer.aadhaar)}
            />
          </div>
        </div>
      ) : null}
    </article>
  );
}
export function SearchFarmerPreview() {
  const { language, t } = useKyfiLanguage();
  const mandalInputRef = useRef<HTMLInputElement | null>(null);
  const villageInputRef = useRef<HTMLInputElement | null>(null);
  const mandalDropdownRef = useRef<HTMLDivElement | null>(null);
  const villageDropdownRef = useRef<HTMLDivElement | null>(null);
  const [form, setForm] = useState({
    mandal: "",
    mandalId: null as number | null,
    village: "",
    villageId: null as number | null,
    farmerName: "",
  });
  const [mandalOptions, setMandalOptions] = useState<MandalSearchResult[]>([]);
  const [villageOptions, setVillageOptions] = useState<VillageSearchResult[]>(
    [],
  );
  const [mandalSearchLoading, setMandalSearchLoading] = useState(false);
  const [villageSearchLoading, setVillageSearchLoading] = useState(false);
  const [hideMandalSuggestions, setHideMandalSuggestions] = useState(false);
  const [hideVillageSuggestions, setHideVillageSuggestions] = useState(false);
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
  const [results, setResults] = useState<FarmerStatusRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionStatusId, setActionStatusId] = useState<number | null>(null);
  const [votesDialogOpen, setVotesDialogOpen] = useState(false);
  const [votesDialogLoading, setVotesDialogLoading] = useState(false);
  const [votesDialogError, setVotesDialogError] = useState("");
  const [votesDialogFarmerName, setVotesDialogFarmerName] = useState("");
  const [votesDialogVotes, setVotesDialogVotes] = useState<
    FarmerStatusVoteVoter[]
  >([]);
  const [proofVoteFarmer, setProofVoteFarmer] =
    useState<FarmerStatusRecord | null>(null);
  const [proofVoteMode, setProofVoteMode] = useState<
    "vote" | "moveToOld" | "moveAndVoteExisting"
  >("vote");
  const [proofVoteSourceStatusId, setProofVoteSourceStatusId] = useState<
    number | null
  >(null);
  const [proofVoteImage, setProofVoteImage] = useState("");
  const [proofVoteError, setProofVoteError] = useState("");
  const [proofVoteSubmitting, setProofVoteSubmitting] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastTone, setToastTone] = useState<"success" | "error">("success");

  const rememberProofVoteSession = () => {
    if (!proofVoteFarmer || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      SEARCH_PROOF_SESSION_KEY,
      JSON.stringify({
        farmer: proofVoteFarmer,
        mode: proofVoteMode,
        sourceStatusId: proofVoteSourceStatusId,
        expiresAt: Date.now() + SEARCH_PROOF_SESSION_TTL_MS,
      }),
    );
  };

  const clearProofVoteSession = () => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(SEARCH_PROOF_SESSION_KEY);
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedSession = window.localStorage.getItem(SEARCH_PROOF_SESSION_KEY);
    if (!storedSession) {
      return;
    }

    try {
      const parsed = JSON.parse(storedSession) as {
        farmer?: FarmerStatusRecord;
        mode?: "vote" | "moveToOld" | "moveAndVoteExisting";
        sourceStatusId?: number | null;
        expiresAt?: number;
      };

      if (!parsed.expiresAt || parsed.expiresAt < Date.now()) {
        clearProofVoteSession();
        return;
      }

      if (parsed.farmer) {
        setProofVoteFarmer(parsed.farmer);
        setProofVoteMode(parsed.mode || "vote");
        setProofVoteSourceStatusId(parsed.sourceStatusId ?? null);
      }
    } catch {
      clearProofVoteSession();
    }
  }, []);

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
    setSelectedMandal(mandal);
    setForm((current) => ({
      ...current,
      mandal: mandal.name,
      mandalId: mandal.id,
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
      if (selected) chooseMandal(selected);
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
      if (selected) chooseVillage(selected);
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
    const currentDistrict =
      mandalOptions.find((item) => item.id === form.mandalId)?.districtName ||
      "";

    setPendingLocationName(form.mandal.trim());
    setSelectedDistrict(null);
    setDistrictQuery(currentDistrict.trim());
    setDistrictOptions([]);
    setDistrictActiveIndex(-1);
    setShowDistrictOptions(false);
    setLocationModal("mandal");
  };
  const openVillageModal = () => {
    if (!form.mandalId) {
      setToastMessage("Select a mandal first.");
      setToastTone("error");
      setToastOpen(true);
      return;
    }
    setPendingLocationName(form.village.trim());
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
      setToastMessage("Select a district and enter a mandal name.");
      setToastTone("error");
      setToastOpen(true);
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
          mandal: response.mandal?.name || mandalName,
          mandalId: response.mandal?.id ?? current.mandalId,
          village: "",
          villageId: null,
        }));
      }
      setToastMessage(response.message);
      setToastTone("success");
      setToastOpen(true);
      closeLocationModal();
    } catch (error) {
      setToastMessage(
        error instanceof Error ? error.message : "Unable to add mandal",
      );
      setToastTone("error");
      setToastOpen(true);
    } finally {
      setSavingLocation(false);
    }
  };
  const handleCreateVillage = async () => {
    const villageName = pendingLocationName.trim();
    const mandalId = Number(form.mandalId || 0);
    if (!mandalId || !villageName) {
      setToastMessage("Select a mandal and enter a village name.");
      setToastTone("error");
      setToastOpen(true);
      return;
    }
    setSavingLocation(true);
    try {
      const response = await createVillage({ mandalId, villageName });
      if (response.village) {
        setForm((current) => ({
          ...current,
          village: response.village?.name || villageName,
          villageId: response.village?.id ?? current.villageId,
        }));
      }
      setToastMessage(response.message);
      setToastTone("success");
      setToastOpen(true);
      closeLocationModal();
    } catch (error) {
      setToastMessage(
        error instanceof Error ? error.message : "Unable to add village",
      );
      setToastTone("error");
      setToastOpen(true);
    } finally {
      setSavingLocation(false);
    }
  };
  const summaryCount = useMemo(() => results.length, [results.length]);
  const runSearch = async () => {
    const mandal = form.mandal.trim();
    const village = form.village.trim();
    const farmer_name = form.farmerName.trim();
    if (!mandal || !village || !farmer_name) {
      setResults([]);
      setToastMessage("Mandal, village, and farmer name are required.");
      setToastTone("error");
      setToastOpen(true);
      return;
    }
    setLoading(true);
    try {
      const response = await searchFarmerStatuses({
        mandal,
        village,
        farmer_name,
      });
      setResults(response.results);
      if (!response.results.length) {
        setToastMessage(t("search.noRecordFound"));
        setToastTone("error");
        setToastOpen(true);
      }
    } catch (error) {
      setResults([]);
      setToastMessage(
        error instanceof Error ? error.message : t("search.unable"),
      );
      setToastTone("error");
      setToastOpen(true);
    } finally {
      setLoading(false);
    }
  };
  const closeProofVoteModal = () => {
    clearProofVoteSession();
    setProofVoteFarmer(null);
    setProofVoteMode("vote");
    setProofVoteSourceStatusId(null);
    setProofVoteImage("");
    setProofVoteError("");
    setProofVoteSubmitting(false);
  };
  const handleProofVoteImageChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    await handleProofVoteImageFile(file);
  };

  const handleProofVoteImageFile = async (file: File) => {
    try {
      setProofVoteError("");
      setProofVoteImage(await imageFileToWebpDataUrl(file));
      clearProofVoteSession();
    } catch (proofError) {
      setProofVoteImage("");
      setProofVoteError(
        proofError instanceof Error
          ? proofError.message
          : "Unable to prepare proof image.",
      );
    }
  };
  const submitProofVote = async () => {
    if (!proofVoteFarmer) return;
    if (!proofVoteImage) {
      setProofVoteError(
        proofVoteMode === "moveToOld" || proofVoteMode === "moveAndVoteExisting"
          ? "Select proof image before moving to old."
          : "Select proof image before voting.",
      );
      return;
    }

    setProofVoteSubmitting(true);
    const actionId = proofVoteSourceStatusId || proofVoteFarmer.id;
    setActionStatusId(actionId);
    try {
      if (proofVoteMode === "moveAndVoteExisting") {
        const moveResponse = await moveFarmerStatusToOld(
          actionId,
          proofVoteImage,
        );
        setResults((current) =>
          current
            .filter((farmer) => farmer.id !== actionId)
            .map((farmer) =>
              farmer.id === proofVoteFarmer.id && moveResponse.farmerStatus
                ? moveResponse.farmerStatus
                : farmer,
            ),
        );
        closeProofVoteModal();
        setToastMessage(
          moveResponse.message ||
            "Existing old farmer voted and duplicate new farmer removed.",
        );
        setToastTone("success");
        setToastOpen(true);
        return;
      }

      const response =
        proofVoteMode === "moveToOld"
          ? await moveFarmerStatusToOld(actionId, proofVoteImage)
          : await incrementFarmerStatusCount(
              proofVoteFarmer.id,
              proofVoteImage,
            );
      if (response.farmerStatus) {
        const updatedFarmer = response.farmerStatus;
        setResults((current) =>
          current.map((farmer) =>
            farmer.id ===
            (proofVoteMode === "moveToOld" ? actionId : proofVoteFarmer.id)
              ? updatedFarmer
              : farmer,
          ),
        );
      }
      closeProofVoteModal();
      setToastMessage(
        proofVoteMode === "moveToOld"
          ? response.message || "Moved to old farmer successfully."
          : "Your vote has been added successfully.",
      );
      setToastTone("success");
      setToastOpen(true);
    } catch (error) {
      setProofVoteError(
        error instanceof Error ? error.message : t("search.unable"),
      );
    } finally {
      setProofVoteSubmitting(false);
      setActionStatusId(null);
    }
  };
  const handleIncrement = async (statusId: number) => {
    const farmer = results.find((item) => item.id === statusId);
    if (farmer?.farmerType === "OLD") {
      setProofVoteFarmer(farmer);
      setProofVoteMode("vote");
      setProofVoteSourceStatusId(null);
      setProofVoteImage("");
      setProofVoteError("");
      return;
    }

    setActionStatusId(statusId);
    try {
      const response = await incrementFarmerStatusCount(statusId);
      if (response.farmerStatus) {
        setResults((current) =>
          current.map((farmer) =>
            farmer.id === statusId ? response.farmerStatus! : farmer,
          ),
        );
      }
      setToastMessage("Your vote has been added successfully.");
      setToastTone("success");
      setToastOpen(true);
    } catch (error) {
      setToastMessage(
        error instanceof Error ? error.message : t("search.unable"),
      );
      setToastTone("error");
      setToastOpen(true);
    } finally {
      setActionStatusId(null);
    }
  };
  const handleDecrement = async (statusId: number) => {
    setActionStatusId(statusId);
    try {
      const response = await decrementFarmerStatusCount(statusId);
      if (response.farmerStatus) {
        setResults((current) =>
          current.map((farmer) =>
            farmer.id === statusId ? response.farmerStatus! : farmer,
          ),
        );
      }
      setToastMessage("Your vote has been removed successfully.");
      setToastTone("success");
      setToastOpen(true);
    } catch (error) {
      setToastMessage(
        error instanceof Error ? error.message : t("search.unable"),
      );
      setToastTone("error");
      setToastOpen(true);
    } finally {
      setActionStatusId(null);
    }
  };
  const handleMoveToOld = async (statusId: number) => {
    const farmer = results.find((item) => item.id === statusId);
    if (!farmer) return;

    setActionStatusId(statusId);
    try {
      const response = await checkFarmerStatus({
        mobileNumber: farmer.mobileNumber || "",
        farmerType: "OLD",
      });
      if (response.farmerStatus) {
        setProofVoteFarmer(response.farmerStatus);
        setProofVoteMode("moveAndVoteExisting");
        setProofVoteSourceStatusId(statusId);
      } else {
        setProofVoteFarmer(farmer);
        setProofVoteMode("moveToOld");
        setProofVoteSourceStatusId(statusId);
      }
      setProofVoteImage("");
      setProofVoteError("");
    } catch (error) {
      setToastMessage(
        error instanceof Error ? error.message : t("search.unable"),
      );
      setToastTone("error");
      setToastOpen(true);
    } finally {
      setActionStatusId(null);
    }
  };
  const handleViewVotes = async (statusId: number, farmerName: string) => {
    setVotesDialogOpen(true);
    setVotesDialogLoading(true);
    setVotesDialogError("");
    setVotesDialogFarmerName(farmerName);
    setVotesDialogVotes([]);

    try {
      const response = await fetchFarmerStatusVoters(statusId);
      setVotesDialogVotes(response.voters);
    } catch (voteError) {
      setVotesDialogError(
        voteError instanceof Error
          ? voteError.message
          : "Unable to load voters",
      );
    } finally {
      setVotesDialogLoading(false);
    }
  };
  const handleVote = async (statusId: number, voteColor: FarmerStatusColor) => {
    setActionStatusId(statusId);
    try {
      const response = await voteFarmerStatus(statusId, voteColor);
      if (response.farmerStatus) {
        setResults((current) =>
          current.map((farmer) =>
            farmer.id === statusId ? response.farmerStatus! : farmer,
          ),
        );
      }
      setToastMessage(response.message);
      setToastTone("success");
      setToastOpen(true);
    } catch (error) {
      setToastMessage(
        error instanceof Error ? error.message : t("search.unable"),
      );
      setToastTone("error");
      setToastOpen(true);
    } finally {
      setActionStatusId(null);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      {" "}
      <section className="space-y-8">
        {" "}
        <div className="space-y-4">
          {" "}
          <p className="kyfi-section-kicker w-fit">{t("search.title")}</p>{" "}
          <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
            {" "}
            <div className="space-y-3">
              {" "}
              <h1 className="max-w-3xl font-manrope text-[clamp(1.85rem,3.4vw,3.25rem)] font-extrabold tracking-[-0.05em] text-slate-900 lg:max-w-none lg:whitespace-nowrap">
                {" "}
                {t("search.heading")}{" "}
              </h1>{" "}
            </div>{" "}
            <div className="flex flex-wrap gap-2 lg:justify-end">
              {" "}
              <Badge variant="secondary">{t("search.live")}</Badge>{" "}
              <Badge variant="secondary">{t("search.masked")}</Badge>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        <div className="space-y-6">
          {" "}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-4">
            {" "}
            <LegendItem
              tone="success"
              label="GREEN"
              text={t("search.legendGreen")}
            />{" "}
            <LegendItem
              tone="warning"
              label="YELLOW"
              text={t("search.legendYellow")}
            />{" "}
            <LegendItem
              tone="destructive"
              label="RED"
              text={t("search.legendRed")}
            />{" "}
          </div>{" "}
          <div className="grid gap-4 border-b border-slate-200/80 pb-5 xl:grid-cols-[1fr_1fr_1fr_auto] xl:items-end">
            {" "}
            <div ref={mandalDropdownRef} className="relative space-y-2">
              {" "}
              <div className="flex items-center justify-between gap-3">
                {" "}
                <label className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-slate-500">
                  {" "}
                  {t("search.mandalLabel")}{" "}
                </label>{" "}
                <button
                  type="button"
                  onClick={openMandalModal}
                  className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-emerald-700 transition hover:bg-emerald-100"
                >
                  {" "}
                  <Plus className="h-3.5 w-3.5" /> Add{" "}
                </button>{" "}
              </div>{" "}
              <Input
                ref={mandalInputRef}
                className="h-12 rounded-full border border-slate-200 bg-white shadow-none focus:border-[rgb(4,120,87)]"
                placeholder={t("search.mandalPlaceholder")}
                value={form.mandal}
                onChange={(event) => {
                  setHideMandalSuggestions(false);
                  setHideVillageSuggestions(false);
                  setForm((current) => ({
                    ...current,
                    mandal: event.target.value,
                    mandalId: null,
                    village: "",
                    villageId: null,
                  }));
                  setVillageOptions([]);
                  setVillageActiveIndex(-1);
                }}
                onKeyDown={handleMandalKeyDown}
              />{" "}
              {form.mandal.trim().length >= 3 && !hideMandalSuggestions ? (
                <div className="absolute left-0 top-full z-20 mt-2 max-h-56 w-full overflow-auto rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                  {" "}
                  {mandalSearchLoading ? (
                    <div className="px-4 py-3 font-manrope text-sm text-slate-500">
                      {" "}
                      {t("search.searchingMandals")}{" "}
                    </div>
                  ) : mandalOptions.length ? (
                    mandalOptions.map((mandal, index) => (
                      <button
                        key={mandal.id}
                        type="button"
                        onClick={() => {
                          chooseMandal(mandal);
                        }}
                        className="flex w-full flex-col items-start gap-1 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-emerald-50"
                        data-active={index === mandalActiveIndex}
                      >
                        {" "}
                        <span className="font-manrope text-sm font-semibold text-slate-900">
                          {" "}
                          {formatMandalSuggestion(mandal)}{" "}
                        </span>{" "}
                        {index === mandalActiveIndex ? (
                          <span className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-emerald-600">
                            {" "}
                            Select{" "}
                          </span>
                        ) : null}{" "}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 font-manrope text-sm text-slate-500">
                      {" "}
                      {t("search.noMandal")}{" "}
                    </div>
                  )}{" "}
                </div>
              ) : null}{" "}
            </div>{" "}
            <div ref={villageDropdownRef} className="relative space-y-2">
              {" "}
              <div className="flex items-center justify-between gap-3">
                {" "}
                <label className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-slate-500">
                  {" "}
                  {t("search.villageLabel")}{" "}
                </label>{" "}
                <button
                  type="button"
                  onClick={openVillageModal}
                  className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-emerald-700 transition hover:bg-emerald-100"
                >
                  {" "}
                  <Plus className="h-3.5 w-3.5" /> Add{" "}
                </button>{" "}
              </div>{" "}
              <Input
                ref={villageInputRef}
                className="h-12 rounded-full border border-slate-200 bg-white shadow-none focus:border-[rgb(4,120,87)] disabled:cursor-not-allowed disabled:bg-slate-50"
                placeholder={t("search.villagePlaceholder")}
                value={form.village}
                disabled={!form.mandalId}
                onChange={(event) => {
                  setHideVillageSuggestions(false);
                  setForm((current) => ({
                    ...current,
                    village: event.target.value,
                    villageId: null,
                  }));
                  setVillageActiveIndex(-1);
                }}
                onKeyDown={handleVillageKeyDown}
              />{" "}
              {form.mandalId &&
              form.village.trim().length >= 2 &&
              !hideVillageSuggestions ? (
                <div className="absolute left-0 top-full z-20 mt-2 max-h-56 w-full overflow-auto rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                  {" "}
                  {villageSearchLoading ? (
                    <div className="px-4 py-3 font-manrope text-sm text-slate-500">
                      {" "}
                      {t("search.searchingMandals")}{" "}
                    </div>
                  ) : villageOptions.length ? (
                    villageOptions.map((village, index) => (
                      <button
                        key={village.id}
                        type="button"
                        onClick={() => chooseVillage(village)}
                        className={[
                          "flex w-full flex-col items-start gap-1 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-emerald-50",
                          index === villageActiveIndex ? "bg-emerald-50" : "",
                        ].join(" ")}
                      >
                        {" "}
                        <span className="font-manrope text-sm font-semibold text-slate-900">
                          {" "}
                          {village.name}{" "}
                        </span>{" "}
                        <span className="text-[0.68rem] font-medium text-slate-500">
                          {" "}
                          {village.mandalName}{" "}
                        </span>{" "}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 font-manrope text-sm text-slate-500">
                      {" "}
                      {t("search.noMandal")}{" "}
                    </div>
                  )}{" "}
                </div>
              ) : null}{" "}
            </div>{" "}
            <div className="space-y-2">
              {" "}
              <label className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-slate-500">
                {" "}
                {t("search.farmerNameLabel")}{" "}
              </label>{" "}
              <div className="relative">
                {" "}
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />{" "}
                <Input
                  className="h-12 rounded-full border border-slate-200 bg-white pl-10 shadow-none focus:border-[rgb(4,120,87)]"
                  placeholder={t("search.farmerNamePlaceholder")}
                  value={form.farmerName}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      farmerName: event.target.value,
                    }))
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void runSearch();
                    }
                  }}
                />{" "}
              </div>{" "}
            </div>{" "}
            <Button
              className="h-12 w-full rounded-full !bg-[rgb(4,120,87)] px-6 font-semibold !text-white shadow-[0_12px_24px_rgba(4,120,87,0.18)] hover:!bg-[rgb(4,120,87)] hover:brightness-110 xl:w-[220px]"
              onClick={runSearch}
              disabled={loading}
            >
              {" "}
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}{" "}
              {loading ? t("search.loading") : t("search.searchButton")}{" "}
            </Button>{" "}
          </div>{" "}
          <section className="space-y-3.5">
            <div className="flex flex-col gap-3 border-b border-slate-200/80 bg-slate-50/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              {" "}
              <div>
                {" "}
                <p className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-slate-500">
                  {" "}
                  {t("search.results")}{" "}
                </p>{" "}
                <p className="mt-1 text-[0.92rem] text-slate-600">
                  {" "}
                  {t("search.pressEnter")}{" "}
                </p>{" "}
              </div>{" "}
              <Badge
                variant="outline"
                className="hidden border-slate-200 bg-white px-3 py-1.5 sm:inline-flex"
              >
                {" "}
                {summaryCount} {t("search.found")}{" "}
              </Badge>{" "}
            </div>{" "}
            <div className="space-y-3.5">
              {results.map((farmer) => (
                <FarmerStatusCard
                  key={farmer.id}
                  farmer={farmer}
                  language={language}
                  t={t}
                  actionStatusId={actionStatusId}
                  onVote={handleVote}
                  onIncrement={handleIncrement}
                  onDecrement={handleDecrement}
                  onMoveToOld={handleMoveToOld}
                  onViewVotes={handleViewVotes}
                />
              ))}{" "}
              {!results.length ? (
                <div className="rounded-[24px] border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
                  <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-slate-500">
                    {t("search.empty")}{" "}
                  </p>{" "}
                  <p className="mt-2 text-[0.92rem] text-slate-600">
                    {t("search.emptyHint")}{" "}
                  </p>{" "}
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </section>
      {locationModal ? (
        <div
          className="kyfi-location-modal fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-[2px]"
          onClick={closeLocationModal}
        >
          {" "}
          <div
            className="kyfi-location-modal-panel w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-[0_28px_80px_rgba(15,23,42,0.22)]"
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
                className="kyfi-location-modal-close inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 sm:border-slate-200 sm:text-slate-600 sm:shadow-none"
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
                      {selectedMandal?.districtName || "-"} district,{" "}
                      {selectedMandal?.stateName || "-"}{" "}
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
        open={toastOpen}
        message={toastMessage}
        tone={toastTone}
        onClose={() => setToastOpen(false)}
      />
      {proofVoteFarmer ? (
        <div
          className="kyfi-content-modal fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-[2px]"
          onClick={closeProofVoteModal}
        >
          <div
            className="kyfi-content-modal-panel flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_28px_80px_rgba(15,23,42,0.22)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 px-6 py-5">
              <div>
                <p className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-emerald-700">
                  {proofVoteMode === "moveToOld" ||
                  proofVoteMode === "moveAndVoteExisting"
                    ? "Move to Old"
                    : "Vote proof"}
                </p>
                <h2 className="mt-1 font-manrope text-xl font-extrabold tracking-[-0.04em] text-slate-950">
                  {proofVoteFarmer.farmerName}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeProofVoteModal}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
              {proofVoteMode !== "moveToOld" ? (
                <div className="kyfi-modal-details-grid grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-slate-500">
                      Farmer name
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {proofVoteFarmer.farmerName}
                    </p>
                  </div>
                  <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-slate-500">
                      Mobile
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {proofVoteFarmer.mobileNumber || "-"}
                    </p>
                  </div>
                  <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-slate-500">
                      Location
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {proofVoteFarmer.village}, {proofVoteFarmer.mandal}
                    </p>
                  </div>
                  <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-slate-500">
                      District
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {proofVoteFarmer.district}
                    </p>
                  </div>
                </div>
              ) : null}

              {proofVoteMode === "vote" &&
              proofVoteFarmer.currentDealerCountAction === "INCREMENT" ? (
                <div className="rounded-[20px] border border-emerald-200 bg-emerald-50/80 px-4 py-4">
                  <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-emerald-700">
                    You already voted
                  </p>
                  <p className="mt-1 text-sm font-semibold text-emerald-950">
                    You have already voted for this farmer.
                  </p>
                </div>
              ) : (
                <>
                  <OldFarmerProofPicker
                    pickerId="search-farmer-proof-vote"
                    image={proofVoteImage}
                    onChange={handleProofVoteImageChange}
                    onFileSelect={handleProofVoteImageFile}
                    onBeforeNativePick={rememberProofVoteSession}
                    onRemove={() => {
                      setProofVoteImage("");
                      setProofVoteError("");
                    }}
                    title="Select one proof image"
                    hint="JPG, JPEG, or PNG will be converted to WebP."
                    previewClassName="max-h-40 w-full rounded-2xl object-contain sm:max-h-56"
                  />
                  {proofVoteError ? (
                    <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                      {proofVoteError}
                    </p>
                  ) : null}
                  <Button
                    type="button"
                    onClick={submitProofVote}
                    disabled={!proofVoteImage || proofVoteSubmitting}
                    className="w-full rounded-full !bg-[rgb(4,120,87)] !text-white hover:!bg-[rgb(4,120,87)] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {proofVoteMode === "moveToOld" ||
                    proofVoteMode === "moveAndVoteExisting"
                      ? proofVoteSubmitting
                        ? "Moving..."
                        : "Move to Old"
                      : proofVoteSubmitting
                        ? "Voting..."
                        : "Vote"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
      {votesDialogOpen ? (
        <div
          className="kyfi-content-modal fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-[2px]"
          onClick={() => {
            setVotesDialogOpen(false);
            setVotesDialogError("");
            setVotesDialogVotes([]);
            setVotesDialogFarmerName("");
          }}
        >
          <div
            className="kyfi-content-modal-panel w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-[0_28px_80px_rgba(15,23,42,0.22)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 px-6 py-5">
              <div>
                <p className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-emerald-700">
                  View Votes
                </p>
                <h2 className="mt-1 font-manrope text-xl font-extrabold tracking-[-0.04em] text-slate-950">
                  {votesDialogFarmerName
                    ? `${votesDialogFarmerName} voter details`
                    : "Dealer vote history"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setVotesDialogOpen(false);
                  setVotesDialogError("");
                  setVotesDialogVotes([]);
                  setVotesDialogFarmerName("");
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[65vh] space-y-3 overflow-y-auto px-6 py-6">
              {votesDialogLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  Loading voters...
                </div>
              ) : votesDialogError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-medium text-red-700">
                  {votesDialogError}
                </div>
              ) : votesDialogVotes.length ? (
                votesDialogVotes
                  .flatMap((voter) =>
                    Array.from(
                      {
                        length: Math.max(1, Number(voter.voteCount || 1)),
                      },
                      (_, voteIndex) => ({ voter, voteIndex }),
                    ),
                  )
                  .map(({ voter, voteIndex }) => (
                  <div
                    key={
                      voter.voteEntryId
                        ? `${voter.voterType || "DEALER"}-${voter.voteEntryId}`
                        : `${voter.voterType || "DEALER"}-${voter.statusId}-${voter.dealerId}-${voter.votedAt}-${voteIndex}`
                    }
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]"
                  >
                    <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-manrope text-base font-bold text-slate-950">
                            {voter.dealerName || "Super Admin"}
                          </p>
                          <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-emerald-700">
                            Dealer
                          </span>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-600">
                            Voted
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-500">
                          ID: {voter.dealerId}
                          {voter.dealerMobile ? ` - ${voter.dealerMobile}` : ""}
                        </p>
                        <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                          <p>
                            <span className="font-semibold text-slate-800">
                              District:
                            </span>{" "}
                            {voter.district || "-"}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-800">
                              Mandal:
                            </span>{" "}
                            {voter.mandal || "-"}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-800">
                              Village:
                            </span>{" "}
                            {voter.village || "-"}
                          </p>
                        </div>
                        <p className="mt-3 text-sm text-slate-600">
                          Voted at {formatVotedDate(voter.votedAt, language)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2">
                        <VoteProofImage src={voter.proofImageUrl} />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  No voters found for this farmer.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}
function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-slate-200/80 bg-white px-4 py-3.5 shadow-[0_8px_18px_rgba(15,23,42,0.03)]">
      {" "}
      <p className="text-[0.66rem] font-black uppercase tracking-[0.18em] text-slate-500">
        {" "}
        {label}{" "}
      </p>{" "}
      <p className="mt-1 text-[0.92rem] font-medium leading-5 text-slate-900">
        {" "}
        {value}{" "}
      </p>{" "}
    </div>
  );
}
function InfoCard({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon?: typeof MapPin;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={[
        "flex items-start gap-3 rounded-[18px] border border-slate-200/80 bg-white px-4 py-3.5 shadow-[0_8px_18px_rgba(15,23,42,0.03)]",
        className || "",
      ].join(" ")}
    >
      {" "}
      {Icon ? (
        <div className="mt-0.5 flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 max-sm:h-7 max-sm:w-7">
          {" "}
          <Icon className="h-3.5 w-3.5 max-sm:h-3 max-sm:w-3" />{" "}
        </div>
      ) : null}{" "}
      <div className="min-w-0">
        {" "}
        <p className="text-[0.64rem] font-black uppercase tracking-[0.2em] text-slate-500 max-sm:text-[0.52rem] max-sm:tracking-[0.14em]">
          {" "}
          {label}{" "}
        </p>{" "}
        <p className="mt-1 truncate text-[0.9rem] font-semibold text-slate-950 max-sm:text-[0.72rem]">
          {" "}
          {value}{" "}
        </p>{" "}
      </div>{" "}
    </div>
  );
}
function LegendItem({
  tone,
  label,
  text,
}: {
  tone: "success" | "warning" | "destructive" | "neutral";
  label: string;
  text: string;
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-100 bg-emerald-50/80"
      : tone === "warning"
        ? "border-amber-100 bg-amber-50/80"
        : tone === "destructive"
          ? "border-red-100 bg-red-50/80"
          : "border-slate-200 bg-slate-50/90";
  return (
    <div className={`flex min-h-[86px] items-center justify-center rounded-2xl border p-2 sm:min-h-[96px] sm:p-4 ${toneClass}`}>
      {" "}
      <div className="flex flex-col items-center justify-center gap-2 text-center">
        {" "}
        <Badge
          className="max-sm:px-2 max-sm:py-0.5 max-sm:text-[0.58rem]"
          variant={
            tone === "success"
              ? "success"
              : tone === "warning"
                ? "warning"
                : tone === "destructive"
                  ? "destructive"
                  : "secondary"
          }
        >
          {" "}
          {label}{" "}
        </Badge>{" "}
        <p className="font-manrope text-[0.78rem] font-bold leading-tight text-slate-900 sm:text-base">
          {text}
        </p>{" "}
      </div>{" "}
    </div>
  );
}
function InfoPill({
  icon: Icon,
  label,
  value,
}: {
  icon?: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
      {" "}
      {Icon ? <Icon className="h-4 w-4 text-slate-500" /> : null}{" "}
      <span className="font-black uppercase tracking-[0.16em] text-slate-500">
        {" "}
        {label}{" "}
      </span>{" "}
      <span className="font-semibold text-slate-800">{value}</span>{" "}
    </div>
  );
}
