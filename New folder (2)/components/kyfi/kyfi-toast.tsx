"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, X } from "lucide-react";
import { translateRuntimeMessage } from "@/lib/kyfi-runtime-message";

type KyfiToastProps = {
  open: boolean;
  message: string;
  tone?: "success" | "error";
  onClose: () => void;
};

export function KyfiToast({
  open,
  message,
  tone = "success",
  onClose,
}: KyfiToastProps) {
  useEffect(() => {
    if (!open) return;

    const timeout = window.setTimeout(() => {
      onClose();
    }, 3000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [open, message, tone, onClose]);

  const displayMessage = translateRuntimeMessage(message);

  return (
    <AnimatePresence>
      {open ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[1100] flex justify-center px-4 pb-5 sm:pb-6">
          <motion.div
            initial={{ opacity: 0, y: 42, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 42, scale: 0.96 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className={[
              "pointer-events-auto flex w-full max-w-lg items-center gap-3 rounded-2xl border bg-white px-4 py-3 shadow-[0_24px_90px_rgba(15,23,42,0.18)]",
              tone === "error" ? "border-red-200" : "border-emerald-200",
            ].join(" ")}
          >
            <div
              className={[
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                tone === "error" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700",
              ].join(" ")}
            >
              <CheckCircle2 className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <p
                className={[
                  "font-manrope text-sm font-semibold",
                  tone === "error" ? "text-red-900" : "text-slate-900",
                ].join(" ")}
              >
                {displayMessage}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close toast"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
