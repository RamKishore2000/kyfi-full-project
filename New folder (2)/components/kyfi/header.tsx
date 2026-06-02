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
  { href: "/blacklist-browser", labelKey: "header.browser" },
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
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [hideSubtitle, setHideSubtitle] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
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
    const handleScroll = () => setScrolled(window.scrollY > 6);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setHideSubtitle(Capacitor.isNativePlatform());
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
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
      className={cn(
        "sticky top-0 z-50 border-b backdrop-blur-xl",
        scrolled
          ? "border-white/60 bg-white/80 shadow-[0_16px_50px_rgba(15,23,42,0.08)]"
          : "border-white/40 bg-white/65",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-3 text-left"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgb(4,120,87)] text-white shadow-[0_14px_30px_rgba(4,120,87,0.22)]">
            <Leaf className="h-6 w-6" />
          </div>
          <div className="leading-tight">
            <div className="font-manrope text-[1.06rem] font-extrabold tracking-[-0.03em] text-[rgb(4,120,87)]">
              KYFI
            </div>
            {!hideSubtitle ? (
              <div className="font-manrope text-[0.74rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
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

    </motion.header>
  );
}
