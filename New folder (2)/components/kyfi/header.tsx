"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { Capacitor } from "@capacitor/core";
import {
  Leaf,
  KeyRound,
  LogIn,
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
  { href: "/", labelKey: "header.home" },
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
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [hideSubtitle, setHideSubtitle] = useState(false);
  const [nativeApp, setNativeApp] = useState(false);
  const [dealerLoggedIn, setDealerLoggedIn] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useKyfiLanguage();

  const normalizePath = (value: string) => value.replace(/\/+$/, "") || "/";
  const isActive = (href: string) => normalizePath(pathname) === normalizePath(href);
  const isLoggedIn = () =>
    typeof window !== "undefined" &&
    Boolean(window.localStorage.getItem("kyfi_token"));
  const protectedRoutes = new Set([
    "/add-farmer-status",
    "/search-farmer-status",
    "/my-records",
    "/profile",
    "/settings",
    "/change-password",
  ]);
  const navigateTo = (href: string) => {
    if (protectedRoutes.has(normalizePath(href)) && !isLoggedIn()) {
      router.push("/login" as any);
      return;
    }

    router.push(href as any);
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("kyfi_token");
      window.localStorage.removeItem("kyfi_dealer");
      window.dispatchEvent(new Event("kyfi-auth-changed"));
    }

    router.push("/login" as any);
  };

  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();
    setNativeApp(isNative);
    setHideSubtitle(isNative);
  }, []);

  useEffect(() => {
    const readLoginState = () => setDealerLoggedIn(isLoggedIn());

    readLoginState();
    window.addEventListener("storage", readLoginState);
    window.addEventListener("kyfi-auth-changed", readLoginState);
    return () => {
      window.removeEventListener("storage", readLoginState);
      window.removeEventListener("kyfi-auth-changed", readLoginState);
    };
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
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="sticky top-0 z-50 border-b border-slate-200/70 bg-white px-0 pt-0 backdrop-blur-xl"
      style={nativeApp ? { backgroundColor: "#F8F8F6" } : undefined}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 px-0 py-2">
          <button
            type="button"
            onClick={() => router.push("/")}
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
                  onClick={() => navigateTo(link.href)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative overflow-hidden rounded-full px-4 py-2 text-left text-[0.92rem] font-semibold transition duration-300",
                    active
                      ? "text-[rgb(4,120,87)]"
                      : "text-slate-700 hover:bg-slate-100 hover:text-[rgb(4,120,87)]",
                  )}
                >
                  <span className="relative inline-flex pb-1.5">
                    <span>{t(link.labelKey)}</span>
                    <span
                      className={cn(
                        "absolute bottom-0 left-0 h-0.5 w-full origin-left rounded-full bg-[rgb(4,120,87)] transition-transform duration-300 ease-out",
                        active
                          ? "scale-x-100"
                          : "scale-x-0 group-hover:scale-x-100",
                      )}
                    />
                  </span>
                </button>
              );
            })}
          </nav>

          <div
            className="relative hidden items-center gap-3 lg:flex"
            ref={profileMenuRef}
            onMouseEnter={() => {
              if (dealerLoggedIn) setProfileMenuOpen(true);
            }}
            onMouseLeave={() => setProfileMenuOpen(false)}
          >
          <button
            type="button"
            onClick={() => {
              if (!dealerLoggedIn) {
                router.push("/login" as any);
                return;
              }

              setProfileMenuOpen((value) => !value);
            }}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-[rgb(4,120,87)] bg-[rgb(4,120,87)] px-4 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(4,120,87,0.25)] transition hover:brightness-105"
              aria-expanded={profileMenuOpen}
              aria-haspopup={dealerLoggedIn ? "menu" : undefined}
            >
              {dealerLoggedIn ? (
                <UserRound className="h-4 w-4" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              {dealerLoggedIn ? t("menu.profile") : "Login"}
            </button>

            <AnimatePresence>
              {dealerLoggedIn && profileMenuOpen ? (
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
                      navigateTo("/profile");
                    }}
                  />
                  <MenuItem
                    icon={Settings}
                    label={t("menu.settings")}
                    onClick={() => {
                      setProfileMenuOpen(false);
                      navigateTo("/settings");
                    }}
                  />
                  <MenuItem
                    icon={KeyRound}
                    label={t("menu.changePassword")}
                    onClick={() => {
                      setProfileMenuOpen(false);
                      navigateTo("/change-password");
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
                if (!dealerLoggedIn) {
                  router.push("/login" as any);
                  return;
                }

                setProfileMenuOpen((value) => !value);
              }}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 bg-white text-slate-700 shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition hover:text-emerald-800"
              aria-label={dealerLoggedIn ? t("header.profileMenu") : "Login"}
              aria-expanded={profileMenuOpen}
              aria-haspopup={dealerLoggedIn ? "menu" : undefined}
            >
              {dealerLoggedIn ? (
                <UserRound className="h-5 w-5" />
              ) : (
                <LogIn className="h-5 w-5" />
              )}
            </button>

            <AnimatePresence>
              {dealerLoggedIn && profileMenuOpen ? (
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
                      navigateTo("/profile");
                    }}
                  />
                  <MenuItem
                    icon={Settings}
                    label={t("menu.settings")}
                    onClick={() => {
                      setProfileMenuOpen(false);
                      navigateTo("/settings");
                    }}
                  />
                  <MenuItem
                    icon={KeyRound}
                    label={t("menu.changePassword")}
                    onClick={() => {
                      setProfileMenuOpen(false);
                      navigateTo("/change-password");
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
