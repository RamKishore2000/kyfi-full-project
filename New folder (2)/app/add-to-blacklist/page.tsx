"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  addBlacklistEntry,
  checkBlacklistEntry,
  type BlacklistEntryRecord,
} from "@/lib/api/blacklist";

function maskAadhaar(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) {
    return "XXXX XXXX XXXX";
  }

  return `XXXX XXXX ${digits.slice(-4)}`;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="font-manrope type-small text-slate-500">{label}</p>
      <p className="mt-1 font-manrope type-nav text-slate-900">{value}</p>
    </div>
  );
}

export default function AddToBlacklistPage() {
  const [form, setForm] = useState({
    farmerName: "",
    aadhaar: "",
    district: "",
    mandal: "",
    village: "",
    reason: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);
  const [aadhaarError, setAadhaarError] = useState("");
  const [existingEntry, setExistingEntry] = useState<BlacklistEntryRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    tone: "success" | "error";
  }>({
    open: false,
    message: "",
    tone: "success",
  });
  const aadhaarInputRef = useRef<HTMLInputElement | null>(null);

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
      return;
    }

    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async () => {
    setLoading(true);
    setMessage(null);
    setMessageType(null);
    setAadhaarError("");
    setModalOpen(false);
    setExistingEntry(null);

    if (!/^\d{12}$/.test(form.aadhaar)) {
      setLoading(false);
      setAadhaarError("Aadhaar number must be exactly 12 digits.");
      aadhaarInputRef.current?.focus();
      return;
    }

    try {
      const checkResponse = await checkBlacklistEntry({ aadhaar: form.aadhaar });

      if (checkResponse.exists && checkResponse.blacklistEntry) {
        setExistingEntry(checkResponse.blacklistEntry);
        setModalOpen(true);
        showToast("Existing blacklist entry found.");
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

      setMessage("Blacklist entry added successfully");
      setMessageType("success");
      showToast("Blacklist entry added successfully");
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
      setMessage(error instanceof Error ? error.message : "Unable to save blacklist entry");
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
          <p className="font-manrope type-small uppercase tracking-[0.2em] text-emerald-700">
            Highest-risk action
          </p>
          <h1 className="mt-3 font-manrope type-section text-slate-900">
            Add to Blacklist
          </h1>
          <p className="mt-4 font-manrope type-body">
            Create a confirmed unpaid dues warning for a farmer. This is separate from GREEN, YELLOW, and RED status.
          </p>
        </motion.div>

        {message ? (
          <div className="mb-6 max-w-3xl">
            <Alert variant={messageType === "error" ? "destructive" : "default"}>
              {message}
            </Alert>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
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
                    <p className="font-manrope type-nav text-slate-900">Blacklist entry form</p>
                    <p className="mt-1 font-manrope type-body">
                      PAN is not required here. Aadhaar is the primary identifier.
                    </p>
                  </div>
                  <Badge variant="destructive">Confirmed unpaid dues</Badge>
                </div>

                <Alert variant="destructive">
                  Blacklist is stronger than normal status and must stay separate. A farmer can still be GREEN overall and be blacklisted.
                </Alert>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <label className="font-manrope type-nav text-slate-800">Farmer name</label>
                    <Input
                      placeholder="Enter farmer name"
                      value={form.farmerName}
                      onChange={(event) => onChange("farmerName", event.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="font-manrope type-nav text-slate-800">Aadhaar number</label>
                    <Input
                      ref={aadhaarInputRef}
                      placeholder="Enter 12-digit Aadhaar"
                      value={form.aadhaar}
                      onChange={(event) => onChange("aadhaar", event.target.value)}
                      inputMode="numeric"
                      maxLength={12}
                      aria-invalid={Boolean(aadhaarError)}
                    />
                    <p className="font-manrope type-small text-slate-500">
                      Enter only 12 digits. Spaces are not needed.
                    </p>
                    {aadhaarError ? (
                      <p className="font-manrope type-small text-red-600">{aadhaarError}</p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label className="font-manrope type-nav text-slate-800">District</label>
                    <Input
                      placeholder="Enter district"
                      value={form.district}
                      onChange={(event) => onChange("district", event.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="font-manrope type-nav text-slate-800">Mandal</label>
                    <Input
                      placeholder="Enter mandal"
                      value={form.mandal}
                      onChange={(event) => onChange("mandal", event.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="font-manrope type-nav text-slate-800">Village</label>
                    <Input
                      placeholder="Enter village"
                      value={form.village}
                      onChange={(event) => onChange("village", event.target.value)}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="font-manrope type-nav text-slate-800">Reason</label>
                    <textarea
                      value={form.reason}
                      onChange={(event) => onChange("reason", event.target.value)}
                      placeholder="Explain the confirmed unpaid dues reason"
                      className="min-h-[120px] w-full rounded-xl border border-input bg-background px-4 py-3 font-manrope type-body text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="font-manrope type-nav text-slate-800">
                      Address <span className="text-slate-400">(optional)</span>
                    </label>
                    <Input
                      placeholder="Optional address for reference"
                      value={form.address}
                      onChange={(event) => onChange("address", event.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    className="w-full sm:w-auto sm:min-w-[280px] lg:min-w-[320px]"
                    size="lg"
                    onClick={submit}
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Add blacklist entry"}
                  </Button>
                </div>
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
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-manrope type-nav text-slate-900">Rules</p>
                      <h2 className="mt-1 font-manrope type-card text-slate-900">
                        Blacklist guidance
                      </h2>
                    </div>
                    <Badge variant="secondary">Dealer view</Badge>
                  </div>
                  <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                    <p className="font-manrope type-nav text-red-900">
                      Blacklist is for confirmed unpaid dues.
                    </p>
                  </div>
                  <ul className="space-y-3 font-manrope type-body text-slate-600">
                    <li>It should still show even if the farmer is GREEN overall.</li>
                    <li>Only admin can remove a blacklist entry.</li>
                    <li>Do not confuse blacklist with status color.</li>
                    <li>Duplicate entries are blocked by Aadhaar.</li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.18 }}
              whileHover={{ y: -4 }}
            >
              <Card className="overflow-hidden border-white/80 bg-white/85 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-manrope type-nav text-slate-900">Input preview</p>
                      <h2 className="mt-1 font-manrope type-card text-slate-900">
                        Aadhaar mask
                      </h2>
                    </div>
                    <Badge variant="outline">{maskedAadhaar}</Badge>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-manrope type-body text-slate-600">
                      The modal will appear only when the Aadhaar already exists in the blacklist table.
                    </p>
                  </div>
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
                  Already blacklisted
                </div>
                <h2 className="font-manrope text-[1.55rem] font-extrabold tracking-[-0.04em] text-slate-900 sm:text-[1.8rem]">
                  Existing blacklist entry found
                </h2>
                <p className="max-w-2xl font-manrope type-body text-slate-600">
                  This Aadhaar is already in the blacklist. Review the existing record below instead of creating a duplicate.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Info label="Farmer" value={existingEntry.farmerName} />
              <Info label="Aadhaar" value={existingEntry.aadhaarMasked} />
              <Info label="Location" value={`${existingEntry.village}, ${existingEntry.mandal}`} />
              <Info label="District" value={existingEntry.district} />
              <div className="sm:col-span-2">
                <Info label="Reason" value={existingEntry.reason} />
              </div>
            </div>

            <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      ) : null}

      <Footer />
    </main>
  );
}

