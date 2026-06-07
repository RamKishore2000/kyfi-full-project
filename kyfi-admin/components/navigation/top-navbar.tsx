"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  Bell,
  CircleGauge,
  Image,
  Landmark,
  LayoutGrid,
  Leaf,
  Menu,
  Moon,
  ShieldCheck,
  Settings,
  Sun,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdminLanguage } from "@/components/admin-language-provider";
import {
  hasAdminPermission,
  hasAnyAdminPermission,
  getStoredAdminAccess,
  clearStoredAdminAccess,
  type AdminPermission,
} from "@/lib/admin-permissions";

const mobileLinks = [
  {
    href: "/dashboard",
    label: "nav.dashboard",
    icon: CircleGauge,
    permissions: ["dashboard.view"],
  },
  {
    href: "/dashboard/dealers",
    label: "nav.dealers",
    icon: Landmark,
    permissions: ["dealers.view", "dealers.add", "dealers.change_status"],
  },
  {
    href: "/dashboard/farmers",
    label: "nav.farmers",
    icon: Leaf,
    permissions: ["farmers.view"],
  },
  {
    href: "/dashboard/notifications",
    label: "nav.notifications",
    icon: Bell,
    permissions: ["notifications.view", "notifications.send"],
  },
  {
    href: "/dashboard/banner",
    label: "nav.banner",
    icon: Image,
    permissions: ["banner.view", "banner.update"],
  },
  {
    href: "/dashboard/subscription",
    label: "nav.subscription",
    icon: LayoutGrid,
    permissions: ["subscription.view", "subscription.update"],
  },
  {
    href: "/dashboard/admins",
    label: "nav.admins",
    icon: ShieldCheck,
    permissions: [
      "admins.view",
      "admins.add",
      "admins.update_permissions",
      "admins.update_status",
    ],
  },
  {
    href: "/dashboard/settings",
    label: "nav.settings",
    icon: Settings,
    permissions: [],
  },
  {
    href: "/dashboard/profile",
    label: "nav.profile",
    icon: UserRound,
    permissions: [],
  },
] satisfies Array<{
  href: string;
  label: string;
  icon: typeof CircleGauge;
  permissions: AdminPermission[];
}>;

export function TopNavbar() {
  const { theme, setTheme } = useTheme();
  const { t } = useAdminLanguage();
  const router = useRouter();
  const [adminLabel, setAdminLabel] = useState("Admin");

  useEffect(() => {
    const access = getStoredAdminAccess();
    setAdminLabel(
      access?.adminRole === "SUPER_ADMIN" ? "Super Admin" : "Admin",
    );
  }, []);

  function handleLogout() {
    window.localStorage.removeItem("kyfi_admin_token");
    window.localStorage.removeItem("kyfi_admin_role");
    clearStoredAdminAccess();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label={t("header.openNav")}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-56">
              {mobileLinks
                .filter(
                  (item) =>
                    !item.permissions.length ||
                    hasAnyAdminPermission(item.permissions),
                )
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href}>
                        <Icon className="h-4 w-4" />
                        {t(item.label)}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-5">
              {t("header.workspace")}
            </p>
            <p className="hidden text-xs font-normal leading-5 text-muted-foreground sm:block">
              {t("header.subtitle")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          {hasAdminPermission("notifications.view") ||
          hasAdminPermission("notifications.send") ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("header.notifications")}
              asChild
            >
              <Link href="/dashboard/notifications">
                <Bell className="h-4 w-4" />
              </Link>
            </Button>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 px-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-white">
                  {adminLabel === "Super Admin" ? "S" : "A"}
                </span>
                <span className="hidden sm:inline">{adminLabel}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile">{t("nav.profile")}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">{t("nav.settings")}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleLogout}>
                {t("header.signOut")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
