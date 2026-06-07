"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CircleGauge,
  Image,
  Landmark,
  Leaf,
  LayoutGrid,
  ShieldCheck,
  Settings,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminLanguage } from "@/components/admin-language-provider";
import {
  hasAnyAdminPermission,
  type AdminPermission,
} from "@/lib/admin-permissions";

const links = [
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

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useAdminLanguage();

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r bg-card/80 px-4 py-5 backdrop-blur lg:block">
      <Link href="/dashboard" className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
          <Leaf className="h-5 w-5" />
        </div>
        <div>
          <p className="text-base font-semibold leading-5 text-primary">
            KYFI Admin
          </p>
          <p className="text-xs font-normal leading-5 text-muted-foreground">
            {t("sidebar.subtitle")}
          </p>
        </div>
      </Link>
      <nav className="space-y-1">
        {links
          .filter(
            (item) =>
              !item.permissions.length ||
              hasAnyAdminPermission(item.permissions),
          )
          .map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium leading-none text-muted-foreground transition hover:bg-accent hover:text-foreground",
                  active && "bg-accent text-foreground shadow-sm",
                )}
              >
                <Icon className="h-4 w-4" />
                {t(item.label)}
              </Link>
            );
          })}
      </nav>
    </aside>
  );
}
