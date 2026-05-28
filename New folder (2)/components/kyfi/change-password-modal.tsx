"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type ChangePasswordModalProps = {
  open: boolean;
  onClose: () => void;
};

export function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-lg rounded-[1.75rem] border border-white/80 bg-white p-6 shadow-[0_24px_90px_rgba(15,23,42,0.18)] sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-manrope type-small uppercase tracking-[0.2em] text-emerald-700">
                  Change Password
                </p>
                <h2 className="mt-2 font-manrope type-section text-slate-900">
                  Update your dealer password
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-slate-600 transition hover:text-slate-900"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <label className="font-manrope type-nav text-slate-800">
                  Current password
                </label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  className="w-full rounded-2xl border border-border bg-white px-4 py-3 font-manrope type-nav text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div className="space-y-2">
                <label className="font-manrope type-nav text-slate-800">
                  New password
                </label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  className="w-full rounded-2xl border border-border bg-white px-4 py-3 font-manrope type-nav text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div className="space-y-2">
                <label className="font-manrope type-nav text-slate-800">
                  Confirm new password
                </label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  className="w-full rounded-2xl border border-border bg-white px-4 py-3 font-manrope type-nav text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <button
                type="button"
                className="w-full rounded-2xl bg-primary px-4 py-3 font-manrope type-nav font-semibold text-white transition hover:bg-primary/90"
                onClick={onClose}
              >
                Update Password
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
