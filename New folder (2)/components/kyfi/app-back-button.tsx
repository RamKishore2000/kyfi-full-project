"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";

export function AppBackButton({ label = "Back" }: { label?: string }) {
  const router = useRouter();

  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:hidden">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition active:scale-[0.98]"
      >
        <ArrowLeft className="h-4 w-4" />
        {label}
      </button>
    </div>
  );
}
