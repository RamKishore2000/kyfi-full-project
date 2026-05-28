"use client";

import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { KeyRound, LogOut, MoreVertical, PencilLine, Settings, UserRound } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChangePasswordModal } from "@/components/kyfi/change-password-modal";

const links = [
  { href: "/dashboard", label: "Home" },
  { href: "/search-farmer-status", label: "Search Farmer Status" },
  { href: "/add-farmer-status", label: "Add Farmer Status" },
  { href: "/add-to-blacklist", label: "Add to Blacklist" },
  { href: "/blacklist-browser", label: "Blacklist Browser" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [hideSubtitle, setHideSubtitle] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("kyfi_token");
      window.localStorage.removeItem("kyfi_dealer");
    }

    router.push("/login" as any);
  };

  const isActive = (href: string) => pathname === href;

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
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
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
      className={cn(
        "sticky top-0 z-50 border-b backdrop-blur-xl",
        scrolled
          ? "border-border/80 bg-[#f8fafc]/95 shadow-sm"
          : "border-transparent bg-[#f8fafc]/90",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-3 text-left"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-lg font-extrabold text-white shadow-soft">
            KY
          </div>
          <div className="leading-tight">
            <div className="font-manrope type-card text-slate-900">
              KYFI
            </div>
            {!hideSubtitle ? (
              <div className="font-manrope type-small text-slate-500">
                Know Your Farmer Information
              </div>
            ) : null}
          </div>
        </button>

        <nav className="hidden items-center gap-6 lg:flex">
          {links.map((link) => (
            <button
              key={link.href}
              type="button"
              onClick={() => router.push(link.href as any)}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={cn(
                "font-manrope type-nav transition text-left",
                isActive(link.href)
                  ? "font-semibold border-b-2 border-[#166534] pb-0.5"
                  : "text-slate-700 hover:text-emerald-700",
              )}
              style={isActive(link.href) ? { color: "#166534" } : undefined}
            >
              {link.label}
            </button>
          ))}
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
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-primary/15 bg-primary px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
            aria-expanded={profileMenuOpen}
            aria-haspopup="menu"
          >
            <UserRound className="h-4 w-4" />
            Profile
          </button>

          <AnimatePresence>
            {profileMenuOpen ? (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className="absolute right-0 top-[calc(100%+0.7rem)] z-50 w-56 overflow-hidden rounded-2xl border border-border bg-white shadow-xl"
                role="menu"
              >
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    router.push("/profile" as any);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left font-manrope type-nav text-slate-700 transition hover:bg-slate-50 hover:text-emerald-700"
                >
                  <PencilLine className="h-4 w-4" />
                  Edit Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    router.push("/settings" as any);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left font-manrope type-nav text-slate-700 transition hover:bg-slate-50 hover:text-emerald-700"
                  >
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    setChangePasswordOpen(true);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left font-manrope type-nav text-slate-700 transition hover:bg-slate-50 hover:text-emerald-700"
                >
                  <KeyRound className="h-4 w-4" />
                  Change Password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left font-manrope type-nav text-slate-700 transition hover:bg-slate-50 hover:text-emerald-700"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="relative flex items-center gap-2 lg:hidden" ref={mobileMenuRef}>
          <button
            type="button"
            onClick={() => {
              setProfileMenuOpen((value) => !value);
              setMobileMenuOpen(false);
            }}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-white text-slate-700 shadow-sm transition hover:text-primary"
            aria-label="Profile menu"
            aria-expanded={profileMenuOpen}
            aria-haspopup="menu"
          >
            <UserRound className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-white text-slate-700 shadow-sm transition hover:text-primary"
            onClick={() => setMobileMenuOpen((value) => !value)}
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          <AnimatePresence>
            {profileMenuOpen ? (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className="absolute right-[44px] top-[calc(100%+0.75rem)] z-50 w-56 overflow-hidden rounded-2xl border border-border bg-white shadow-xl"
                role="menu"
              >
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    router.push("/profile" as any);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left font-manrope type-nav text-slate-700 transition hover:bg-slate-50 hover:text-emerald-700"
                >
                  <PencilLine className="h-4 w-4" />
                  Edit Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    router.push("/settings" as any);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left font-manrope type-nav text-slate-700 transition hover:bg-slate-50 hover:text-emerald-700"
                  >
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    setChangePasswordOpen(true);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left font-manrope type-nav text-slate-700 transition hover:bg-slate-50 hover:text-emerald-700"
                >
                  <KeyRound className="h-4 w-4" />
                  Change Password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left font-manrope type-nav text-slate-700 transition hover:bg-slate-50 hover:text-emerald-700"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </motion.div>
            ) : null}
            {mobileMenuOpen ? (
              <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18 }}
                className="absolute right-[-4px] top-[calc(100%+0.75rem)] z-50 w-64 overflow-hidden rounded-2xl border border-border bg-white shadow-xl"
              >
                <div className="border-b border-border px-4 py-3">
                  <p className="font-manrope type-small uppercase tracking-[0.18em] text-slate-500">
                    Menu
                  </p>
                  <p className="mt-1 font-manrope type-card text-slate-900">
                    KYFI shortcuts
                  </p>
                </div>

                <div className="p-2">
                  {links.map((link) => (
                    <button
                      type="button"
                      key={link.href}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        router.push(link.href as any);
                      }}
                      aria-current={isActive(link.href) ? "page" : undefined}
                      className={cn(
                        "block w-full rounded-xl px-3 py-3 text-left font-manrope type-nav transition",
                        isActive(link.href)
                          ? "font-semibold border-b-2 border-[#166534]"
                          : "text-slate-700 hover:bg-slate-50 hover:text-emerald-700",
                      )}
                      style={isActive(link.href) ? { color: "#166534" } : undefined}
                    >
                      {link.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <ChangePasswordModal
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </motion.header>
  );
}
