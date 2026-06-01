"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { useAdminLanguage } from "@/components/admin-language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const { t } = useAdminLanguage();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">{t("auth.resetTitle")}</CardTitle>
        <CardDescription>{t("auth.resetDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="space-y-2 text-sm font-normal">
          Email
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="admin@kyfi.in" type="email" />
          </div>
        </label>
        <Button className="w-full">{t("auth.sendResetLink")}</Button>
        <Button className="w-full" variant="ghost" asChild>
          <Link href="/login">{t("auth.backToLogin")}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
