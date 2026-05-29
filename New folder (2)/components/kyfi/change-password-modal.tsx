"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { updateDealerPassword } from "@/lib/api/profile";
import { useKyfiLanguage } from "@/components/kyfi/language-provider";

type ChangePasswordModalProps = {
  open: boolean;
  onClose: () => void;
};

export function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const { t } = useKyfiLanguage();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  const reset = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setLoading(false);
    setMessage("");
    setError("");
  };

  const closeModal = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    setMessage("");
    setError("");

    if (newPassword.trim().length < 4) {
      setError("New password must be at least 4 characters.");
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setError("New password and confirm password must match.");
      return;
    }

    setLoading(true);

    try {
      const response = await updateDealerPassword({
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      });

      setMessage(response.message || "Password updated successfully");
      setTimeout(() => closeModal(), 1200);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to update password");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-md"
          onClick={onClose}
        >
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          onClick={(event) => event.stopPropagation()}
          className="w-full max-w-lg rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_28px_100px_rgba(15,23,42,0.2)] sm:p-8"
        >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="kyfi-section-kicker">{t("settings.changePassword")}</p>
                <h2 className="mt-3 font-manrope text-[1.65rem] font-extrabold tracking-[-0.04em] text-slate-900">
                  {t("settings.passwordHeader")}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <label className="font-manrope type-nav text-slate-800">
                  {t("settings.currentPassword")}
                </label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="font-manrope type-nav text-slate-800">
                  {t("settings.newPassword")}
                </label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="font-manrope type-nav text-slate-800">
                  {t("settings.confirmPassword")}
                </label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>

              <button
                type="button"
                className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-70"
                onClick={() => void handleSubmit()}
                disabled={loading}
              >
                {loading ? t("settings.updating") : t("settings.submitPassword")}
              </button>

              {error ? <p className="font-manrope text-sm text-red-600">{error}</p> : null}
              {message ? <p className="font-manrope text-sm text-emerald-700">{message}</p> : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
