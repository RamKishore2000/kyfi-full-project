"use client";

import Link from "next/link";
import { useAdminLanguage } from "@/components/admin-language-provider";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const { t } = useAdminLanguage();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-medium">{t("auth.pageNotFound")}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{t("auth.notFoundDescription")}</p>
      <Button asChild><Link href="/dashboard">{t("auth.backToDashboard")}</Link></Button>
    </main>
  );
}
