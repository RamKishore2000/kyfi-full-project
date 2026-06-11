"use client";

import { BarChart3, CirclePlus, Home, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Capacitor } from "@capacitor/core";
import { cn } from "@/lib/utils";
import { useKyfiLanguage } from "@/components/kyfi/language-provider";

const tabs = [
  { href: "/", labelKey: "header.home", icon: Home },
  {
    href: "/add-farmer-status",
    labelKey: "header.addStatus",
    icon: CirclePlus,
  },
  { href: "/search-farmer-status", labelKey: "header.search", icon: Search },
  { href: "/my-records", labelKey: "myRecords.kicker", icon: BarChart3 },
  // { href: "/add-to-blacklist", labelKey: "header.blacklist", icon: ShieldAlert },
  // { href: "/blacklist-browser", labelKey: "header.browser", icon: ShieldCheck },
];

export function MobileBottomTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useKyfiLanguage();
  const isNative = Capacitor.isNativePlatform();

  const visible =
    pathname === "/" ||
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
      <nav
        className={cn(
          "fixed z-50 border border-slate-200/80 bg-white/95 px-2 pt-2 shadow-[0_-12px_40px_rgba(15,23,42,0.12)] backdrop-blur-2xl",
          isNative
            ? "inset-x-0 bottom-0 rounded-t-[1.25rem] pb-[max(0.25rem,env(safe-area-inset-bottom))]"
            : "inset-x-3 bottom-3 rounded-[1.5rem] pb-[max(0.35rem,env(safe-area-inset-bottom))] md:hidden",
        )}
      >
        <div className="mx-auto grid max-w-7xl grid-cols-4 gap-1">
          {tabs.map((tab) => {
            const active =
              pathname === tab.href ||
              (tab.href === "/" && pathname?.startsWith("/dashboard"));
            const Icon = tab.icon;

            return (
              <button
                key={tab.href}
                type="button"
                onClick={() =>
                  router.push((isNative && tab.href === "/" ? "/dashboard" : tab.href) as any)
                }
                className={cn(
                  "flex min-h-[3.35rem] flex-col items-center justify-center gap-0.5 rounded-[1rem] px-1.5 py-1.5 text-center transition",
                  active
                    ? "text-emerald-800"
                    : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-800",
                )}
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-[0.9rem] transition",
                    active
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-transparent text-current",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="w-full text-[0.64rem] font-semibold leading-tight tracking-[-0.01em]">
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

      <div
        className={cn(isNative ? "h-[5.35rem]" : "h-[6.5rem] md:hidden")}
        aria-hidden="true"
      />
    </>
  );
}
