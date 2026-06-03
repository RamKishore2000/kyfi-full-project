"use client";

import { CirclePlus, Home, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useKyfiLanguage } from "@/components/kyfi/language-provider";

const tabs = [
  { href: "/dashboard", labelKey: "header.home", icon: Home },
  {
    href: "/add-farmer-status",
    labelKey: "header.addStatus",
    icon: CirclePlus,
  },
  { href: "/search-farmer-status", labelKey: "header.search", icon: Search },
  // { href: "/add-to-blacklist", labelKey: "header.blacklist", icon: ShieldAlert },
  // { href: "/blacklist-browser", labelKey: "header.browser", icon: ShieldCheck },
];

export function MobileBottomTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useKyfiLanguage();

  const visible =
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/search-farmer-status") ||
    pathname?.startsWith("/add-farmer-status") ||
    pathname?.startsWith("/my-records") ||
    pathname?.startsWith("/profile") ||
    pathname?.startsWith("/settings");

  if (!visible) {
    return null;
  }

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/70 bg-white/92 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-7xl grid-cols-3 gap-1">
          {tabs.map((tab) => {
            const active = pathname === tab.href;
            const Icon = tab.icon;

            return (
              <button
                key={tab.href}
                type="button"
                onClick={() => router.push(tab.href as any)}
                className={cn(
                  "flex min-h-[4.35rem] flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-center transition",
                  active
                    ? "text-emerald-800"
                    : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-800",
                )}
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-2xl transition",
                    active
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-transparent text-current",
                  )}
                >
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span className="w-full text-[0.66rem] font-semibold leading-tight tracking-[-0.01em]">
                  {t(tab.labelKey)}
                </span>
                {active ? (
                  <motion.span
                    layoutId="mobile-bottom-tab-active"
                    className="h-1 w-8 rounded-full bg-emerald-700"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                ) : (
                  <span className="h-1 w-8 rounded-full bg-transparent" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="h-24 md:hidden" aria-hidden="true" />
    </>
  );
}
