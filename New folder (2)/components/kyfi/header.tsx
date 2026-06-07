"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { Capacitor } from "@capacitor/core";
import {
  Leaf,
  KeyRound,
  LogOut,
  PencilLine,
  Settings,
  UserRound,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useKyfiLanguage } from "@/components/kyfi/language-provider";

const links = [
  { href: "/dashboard", labelKey: "header.home" },
  { href: "/add-farmer-status", labelKey: "header.addStatus" },
  { href: "/search-farmer-status", labelKey: "header.search" },
  // { href: "/blacklist-browser", labelKey: "header.browser" },
  { href: "/my-records", labelKey: "myRecords.kicker" },
];

function MenuItem({
  icon: Icon,
  label,
  onClick,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-emerald-800"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [hideSubtitle, setHideSubtitle] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const lastScrollY = useRef(0);
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useKyfiLanguage();

  const isActive = (href: string) => pathname === href;

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("kyfi_token");
      window.localStorage.removeItem("kyfi_dealer");
      window.dispatchEvent(new Event("kyfi-auth-changed"));
    }

    router.push("/login" as any);
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 6);

      if (currentScrollY <= 6) {
        setHeaderVisible(true);
      } else if (currentScrollY > lastScrollY.current) {
        setHeaderVisible(false);
      } else if (currentScrollY < lastScrollY.current) {
        setHeaderVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setHideSubtitle(Capacitor.isNativePlatform());
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: headerVisible ? 1 : 0, y: headerVisible ? 0 : -34 }}
      transition={{ duration: 0.45 }}
      className={cn(
        "sticky top-0 z-50 px-0 pt-0 backdrop-blur-xl transition-[opacity,transform] duration-300",
        scrolled ? "bg-[#F5F5F5]/80" : "bg-[#F5F5F5]/55",
        headerVisible ? "pointer-events-auto" : "pointer-events-none",
      )}
    >
      <div className="w-full border border-slate-200/70 bg-[#F5F5F5]/92 px-3 py-2 shadow-[0_16px_50px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/50 backdrop-blur-xl sm:px-4 lg:px-5">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-3 rounded-2xl px-1 py-0.5 text-left transition hover:bg-slate-50/80"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgb(4,120,87)] text-white shadow-[0_14px_30px_rgba(4,120,87,0.22)] sm:h-12 sm:w-12">
              <Leaf className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="leading-tight">
              <div className="font-manrope text-[1.06rem] font-extrabold tracking-[-0.03em] text-[rgb(4,120,87)]">
                KYFI
              </div>
              {!hideSubtitle ? (
                <div className="hidden font-manrope text-[0.74rem] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:block">
                  {t("header.subtitle")}
                </div>
              ) : null}
            </div>
          </button>

          <nav className="hidden items-center gap-2 lg:flex">
            {links.map((link) => {
              const active = isActive(link.href);

              return (
                <button
                  key={link.href}
                  type="button"
                  onClick={() => router.push(link.href as any)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative rounded-full px-4 py-2 text-left text-[0.92rem] font-semibold transition",
                    active
                      ? "text-[rgb(4,120,87)]"
                      : "text-slate-700 hover:bg-slate-100 hover:text-[rgb(4,120,87)]",
                  )}
                >
                  <span className="relative inline-flex flex-col">
                    <span>{t(link.labelKey)}</span>
                    {active ? (
                      <motion.span
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="mt-1 h-0.5 w-full origin-left rounded-full bg-[rgb(4,120,87)]"
                      />
                    ) : null}
                  </span>
                </button>
              );
            })}
          </nav>

          <div
            className="relative hidden items-center gap-3 lg:flex"
            ref={profileMenuRef}
            onMouseEnter={() => setProfileMenuOpen(true)}
            onMouseLeave={() => setProfileMenuOpen(false)}
          >
            <button
              type="button"
              onClick={() => setProfileMenuOpen((value) => !value)}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-[rgb(4,120,87)] bg-[rgb(4,120,87)] px-4 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(4,120,87,0.25)] transition hover:brightness-105"
              aria-expanded={profileMenuOpen}
              aria-haspopup="menu"
            >
              <UserRound className="h-4 w-4" />
              {t("menu.profile")}
            </button>

            <AnimatePresence>
              {profileMenuOpen ? (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  className="absolute right-0 top-[calc(100%+0.7rem)] z-50 w-60 overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.16)]"
                  role="menu"
                >
                  <MenuItem
                    icon={PencilLine}
                    label={t("menu.editProfile")}
                    onClick={() => {
                      setProfileMenuOpen(false);
                      router.push("/profile" as any);
                    }}
                  />
                  <MenuItem
                    icon={Settings}
                    label={t("menu.settings")}
                    onClick={() => {
                      setProfileMenuOpen(false);
                      router.push("/settings" as any);
                    }}
                  />
                  <MenuItem
                    icon={KeyRound}
                    label={t("menu.changePassword")}
                    onClick={() => {
                      setProfileMenuOpen(false);
                      router.push("/change-password" as any);
                    }}
                  />
                  <MenuItem
                    icon={LogOut}
                    label={t("menu.logout")}
                    onClick={() => {
                      setProfileMenuOpen(false);
                      handleLogout();
                    }}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="relative flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => {
                setProfileMenuOpen((value) => !value);
              }}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 bg-white text-slate-700 shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition hover:text-emerald-800"
              aria-label={t("header.profileMenu")}
              aria-expanded={profileMenuOpen}
              aria-haspopup="menu"
            >
              <UserRound className="h-5 w-5" />
            </button>

            <AnimatePresence>
              {profileMenuOpen ? (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  className="absolute right-[44px] top-[calc(100%+0.75rem)] z-50 w-56 overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.16)]"
                  role="menu"
                >
                  <MenuItem
                    icon={PencilLine}
                    label={t("menu.editProfile")}
                    onClick={() => {
                      setProfileMenuOpen(false);
                      router.push("/profile" as any);
                    }}
                  />
                  <MenuItem
                    icon={Settings}
                    label={t("menu.settings")}
                    onClick={() => {
                      setProfileMenuOpen(false);
                      router.push("/settings" as any);
                    }}
                  />
                  <MenuItem
                    icon={KeyRound}
                    label={t("menu.changePassword")}
                    onClick={() => {
                      setProfileMenuOpen(false);
                      router.push("/change-password" as any);
                    }}
                  />
                  <MenuItem
                    icon={LogOut}
                    label={t("menu.logout")}
                    onClick={() => {
                      setProfileMenuOpen(false);
                      handleLogout();
                    }}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
