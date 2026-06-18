"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  KYFI_ACCOUNT_BLOCKED_EVENT,
  type DealerAccountBlockCode,
} from "@/lib/api/account-status";

type BlockedAccountState = {
  code: DealerAccountBlockCode;
  message: string;
};

const titles: Record<DealerAccountBlockCode, string> = {
  DEALER_PENDING: "Account pending approval",
  DEALER_REJECTED: "Account rejected",
  DEALER_SUSPENDED: "Account suspended",
  DEALER_NOT_APPROVED: "Account not approved",
};

export function AccountStatusModal() {
  const [blockedAccount, setBlockedAccount] =
    useState<BlockedAccountState | null>(null);

  useEffect(() => {
    const onBlocked = (event: Event) => {
      const detail = (event as CustomEvent<BlockedAccountState>).detail;
      if (!detail?.code) {
        return;
      }

      setBlockedAccount({
        code: detail.code,
        message:
          detail.message ||
          "Your dealer account cannot access KYFI right now.",
      });
    };

    window.addEventListener(KYFI_ACCOUNT_BLOCKED_EVENT, onBlocked);
    return () =>
      window.removeEventListener(KYFI_ACCOUNT_BLOCKED_EVENT, onBlocked);
  }, []);

  const title = useMemo(() => {
    if (!blockedAccount) {
      return "";
    }

    return titles[blockedAccount.code] || "Account access blocked";
  }, [blockedAccount]);

  const goToLogin = () => {
    window.localStorage.removeItem("kyfi_token");
    window.localStorage.removeItem("kyfi_dealer");
    window.localStorage.removeItem("kyfi_pending_dealer");
    window.dispatchEvent(new Event("kyfi-auth-changed"));
    window.location.assign("/login");
  };

  if (!blockedAccount) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kyfi-account-status-title"
    >
      <div className="w-full max-w-md rounded-[30px] border border-white/70 bg-white p-6 text-center shadow-[0_28px_90px_rgba(15,23,42,0.32)] sm:p-7">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-600 shadow-inner">
          <AlertTriangle className="h-8 w-8" aria-hidden="true" />
        </div>

        <h2
          id="kyfi-account-status-title"
          className="mt-5 font-manrope text-2xl font-extrabold tracking-[-0.04em] text-slate-950"
        >
          {title}
        </h2>

        <p className="mt-3 font-manrope text-base leading-7 text-slate-600">
          {blockedAccount.message}
        </p>

        <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 font-manrope text-sm font-semibold text-emerald-800">
          Please contact KYFI support if you think this is a mistake.
        </p>

        <button
          type="button"
          onClick={goToLogin}
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#047857] px-5 font-manrope text-base font-extrabold text-white shadow-[0_18px_40px_rgba(4,120,87,0.28)] transition hover:bg-[#03694c] active:scale-[0.99]"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}
