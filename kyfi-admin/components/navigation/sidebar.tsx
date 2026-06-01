"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CircleGauge,
  Image,
  Landmark,
  Leaf,
  Settings,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminLanguage } from "@/components/admin-language-provider";

const links = [
  { href: "/dashboard", label: "nav.dashboard", icon: CircleGauge },
  { href: "/dashboard/dealers", label: "nav.dealers", icon: Landmark },
  { href: "/dashboard/farmers", label: "nav.farmers", icon: Leaf },
  { href: "/dashboard/blacklist", label: "nav.blacklist", icon: ShieldAlert },
  { href: "/dashboard/notifications", label: "nav.notifications", icon: Bell },
  { href: "/dashboard/banner", label: "nav.banner", icon: Image },
  { href: "/dashboard/settings", label: "nav.settings", icon: Settings },
  { href: "/dashboard/profile", label: "nav.profile", icon: UserRound },
];

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
          <p className="text-base font-semibold leading-5 text-primary">KYFI Admin</p>
          <p className="text-xs font-normal leading-5 text-muted-foreground">{t("sidebar.subtitle")}</p>
        </div>
      </Link>
      <nav className="space-y-1">
        {links.map((item) => {
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
