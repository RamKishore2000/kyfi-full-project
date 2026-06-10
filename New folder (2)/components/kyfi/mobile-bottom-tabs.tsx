"use client";

import { BarChart3, CirclePlus, Home, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
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

  const visible =
    pathname === "/" ||
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
      <nav className="fixed inset-x-3 bottom-3 z-50 rounded-[1.5rem] border border-slate-200/80 bg-white/90 px-2 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_40px_rgba(15,23,42,0.12)] backdrop-blur-2xl md:hidden">
        <div className="mx-auto grid max-w-7xl grid-cols-4 gap-1">
          {tabs.map((tab) => {
            const active = pathname === tab.href;
            const Icon = tab.icon;

            return (
              <button
                key={tab.href}
                type="button"
                onClick={() => router.push(tab.href as any)}
                className={cn(
                  "flex min-h-[4rem] flex-col items-center justify-center gap-1 rounded-[1.15rem] px-1.5 py-2 text-center transition",
                  active
                    ? "text-emerald-800"
                    : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-800",
                )}
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-[1rem] transition",
                    active
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-transparent text-current",
                  )}
                >
                  <Icon className="h-4.5 w-4.5" />
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

      <div className="h-[6.25rem] md:hidden" aria-hidden="true" />
    </>
  );
}
