"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
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

export default function AddFarmerStatusPage() {
  const [selectedStatus, setSelectedStatus] = useState<FarmerStatusColor>("GREEN");
  const [form, setForm] = useState<FarmerStatusForm>({
    farmerName: "",
    aadhaar: "",
    mobileNumber: "",
    district: "",
    mandal: "",
    village: "",
    rationCardAddress: "",
    remarks: "",
  });
  const [existingFarmer, setExistingFarmer] = useState<FarmerStatusRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
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
      setForm((current) => ({ ...current, [field]: value }));
      setError("");
      setMessage("");
    };

  const lookupExisting = async () => {
    const aadhaar = form.aadhaar.replace(/\s+/g, "").trim();
    const mobileNumber = form.mobileNumber.trim();

    if (!aadhaar && !mobileNumber) {
      setError("Enter Aadhaar or mobile number to check an existing record.");
      return null;
    }

    setIsChecking(true);

    try {
      const response = await checkFarmerStatus({ aadhaar, mobileNumber });
      if (response.exists && response.farmerStatus) {
        setExistingFarmer(response.farmerStatus);
        setModalOpen(true);
        showToast("Existing farmer record found.");
        setMessage("Existing farmer record found.");
        return response.farmerStatus;
      }

      setExistingFarmer(null);
      setMessage("No existing farmer record found.");
      return null;
    } catch (checkError) {
      setError(checkError instanceof Error ? checkError.message : "Check failed");
      return null;
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const aadhaar = form.aadhaar.replace(/\s+/g, "").trim();
    const mobileNumber = form.mobileNumber.trim();

    if (!aadhaar || aadhaar.length !== 12) {
      setError("Enter a valid 12-digit Aadhaar number.");
      return;
    }

    if (mobileNumber && !/^[6-9]\d{9}$/.test(mobileNumber)) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    if (
      !form.farmerName.trim() ||
      !form.district.trim() ||
      !form.mandal.trim() ||
      !form.village.trim()
    ) {
      setError("Farmer name, district, mandal, and village are required.");
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
      showToast("Farmer status added");
      setMessage("Farmer status added");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Save failed");
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
      setError(voteError instanceof Error ? voteError.message : "Vote failed");
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
            Dealer-only record entry
          </p>
          <h1 className="mt-3 font-manrope type-section text-slate-900">Add Farmer Status</h1>
          <p className="mt-4 font-manrope type-body">
            Create a general farmer reputation record using Aadhaar as the primary identifier. This screen is not for blacklist entries.
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            whileHover={{ y: -4 }}
          >
            <Card className="overflow-hidden border-white/80 bg-white/85 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <CardContent className="space-y-6 p-6 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-manrope type-nav text-slate-900">Farmer status form</p>
                    <p className="mt-1 font-manrope type-body">
                      PAN is not required here. Use Aadhaar, mobile, mandal, and village.
                    </p>
                  </div>
                  <Badge variant="secondary">General status only</Badge>
                </div>

                <Alert>
                  Blacklist is separate from status. This form creates only GREEN, YELLOW, or RED reputation records.
                </Alert>

                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <label className="font-manrope type-nav text-slate-800">Farmer name</label>
                      <Input
                        placeholder="Enter farmer name"
                        value={form.farmerName}
                        onChange={handleChange("farmerName")}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="font-manrope type-nav text-slate-800">Aadhaar number</label>
                      <Input
                        placeholder="XXXX XXXX 1234"
                        type="text"
                        inputMode="numeric"
                        maxLength={12}
                        pattern="[0-9]{12}"
                        autoComplete="off"
                        value={form.aadhaar}
                        onChange={handleChange("aadhaar")}
                        required
                      />
                      <p className="font-manrope type-small text-slate-500">
                        Enter only 12 digits. Spaces are not needed.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="font-manrope type-nav text-slate-800">Mobile number</label>
                      <Input
                        placeholder="Enter mobile number"
                        inputMode="tel"
                        maxLength={10}
                        value={form.mobileNumber}
                        onChange={handleChange("mobileNumber")}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="font-manrope type-nav text-slate-800">District</label>
                      <Input
                        placeholder="Enter district"
                        value={form.district}
                        onChange={handleChange("district")}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="font-manrope type-nav text-slate-800">Mandal</label>
                      <Input
                        placeholder="Enter mandal"
                        value={form.mandal}
                        onChange={handleChange("mandal")}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="font-manrope type-nav text-slate-800">Village</label>
                      <Input
                        placeholder="Enter village"
                        value={form.village}
                        onChange={handleChange("village")}
                        required
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="font-manrope type-nav text-slate-800">
                        Ration card / address <span className="text-slate-400">(optional)</span>
                      </label>
                      <Input
                        placeholder="Optional address or ration card reference"
                        value={form.rationCardAddress}
                        onChange={handleChange("rationCardAddress")}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="font-manrope type-nav text-slate-800">
                        Remarks <span className="text-slate-400">(optional)</span>
                      </label>
                      <textarea
                        placeholder="Add short notes about repayment pattern or season"
                        value={form.remarks}
                        onChange={handleChange("remarks")}
                        className="min-h-[120px] w-full rounded-xl border border-input bg-background px-4 py-3 font-manrope type-body text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="font-manrope type-nav text-slate-800">Status</p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {statusOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setSelectedStatus(option.value)}
                          className={[
                            "rounded-2xl border px-4 py-4 text-left transition",
                            selectedStatus === option.value
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border bg-slate-50 hover:border-primary/30 hover:bg-primary/5",
                          ].join(" ")}
                        >
                          <p className="font-manrope type-card text-slate-900">{option.label}</p>
                          <p className="mt-1 font-manrope type-small text-slate-500">{option.helper}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      className="w-full sm:w-auto sm:min-w-[280px] lg:min-w-[320px]"
                      size="lg"
                      type="submit"
                      disabled={isSubmitting || isChecking}
                    >
                      {isSubmitting ? "Saving..." : "Add farmer status"}
                    </Button>
                  </div>

                  {error ? <p className="font-manrope type-small text-red-600">{error}</p> : null}
                  {message ? <p className="font-manrope type-small text-emerald-700">{message}</p> : null}
                </form>
              </CardContent>
            </Card>
          </motion.div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.12 }}
              whileHover={{ y: -4 }}
            >
              <Card className="overflow-hidden border-white/80 bg-white/85 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-manrope type-nav text-slate-900">Help</p>
                      <h2 className="mt-1 font-manrope type-card text-slate-900">Simple record entry rules</h2>
                    </div>
                    <Badge variant="secondary">Dealer view</Badge>
                  </div>
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <p className="font-manrope type-nav text-emerald-900">
                      PAN is not required here; use Aadhaar, mobile, mandal, and village.
                    </p>
                  </div>
                  <ul className="space-y-3 font-manrope type-body text-slate-600">
                    <li>Other dealers can vote once to confirm the pattern.</li>
                    <li>Admin can remove false or disputed records.</li>
                    <li>Blacklist stays separate from GREEN, YELLOW, and RED status.</li>
                    <li>Duplicate records are blocked by Aadhaar.</li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
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
                  {existingFarmer ? "Existing farmer status" : "Farmer status"}
                </p>
                <p className="mt-1 font-manrope type-body text-slate-600">
                  {existingFarmer
                    ? "This farmer already exists. Review the record and vote if needed."
                    : "A newly added farmer status record."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Info label="Farmer" value={existingFarmer?.farmerName || form.farmerName || "Suresh Reddy"} />
              <Info
                label="Status"
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
              <Info label="Aadhaar" value={existingFarmer?.aadhaarMasked || maskAadhaar(form.aadhaar)} />
              <Info label="Mobile" value={existingFarmer?.mobileNumber || form.mobileNumber || "Not provided"} />
              <Info
                label="Location"
                value={
                  existingFarmer
                    ? `${existingFarmer.village}, ${existingFarmer.mandal}, ${existingFarmer.district}`
                    : `${form.village || "Village"}, ${form.mandal || "Mandal"}, ${form.district || "District"}`
                }
              />
              <Info label="Votes" value={String(existingFarmer?.voteCount ?? 0)} />
            </div>

            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="font-manrope type-body text-amber-900">
                {existingFarmer
                  ? existingFarmer.currentDealerVoted
                    ? "You already voted on this farmer status."
                    : "This farmer status already exists from another dealer. You can vote once to confirm the pattern."
                  : "This record was created successfully."}
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              {existingFarmer && existingFarmer.canVote ? (
                <Button onClick={() => void handleVote()} disabled={isVoting}>
                  {isVoting ? "Voting..." : "Vote once"}
                </Button>
              ) : null}
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Close
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

