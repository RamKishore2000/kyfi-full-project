"use client";

import { useTheme } from "next-themes";
import { Globe2, Moon } from "lucide-react";
import { useEffect } from "react";
import { useAdminLanguage } from "@/components/admin-language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/navigation/page-header";

export default function SettingsPage() {
  const { setTheme } = useTheme();
  const { language, setLanguage, t } = useAdminLanguage();

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <>
      <PageHeader title={t("settings.title")} description={t("settings.description")} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Moon className="h-5 w-5" />{t("settings.themeTitle")}</CardTitle>
            <CardDescription>{t("settings.themeDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setTheme("light")}>{t("settings.light")}</Button>
            <Button variant="outline" onClick={() => setTheme("dark")}>{t("settings.dark")}</Button>
            <Button variant="outline" onClick={() => setTheme("system")}>{t("settings.system")}</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Globe2 className="h-5 w-5" />{t("settings.languageTitle")}</CardTitle>
            <CardDescription>{t("settings.languageDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={language} onValueChange={(value) => setLanguage(value as "en" | "te")}>
              <SelectTrigger className="w-full"><SelectValue placeholder={t("common.selectLanguage")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t("common.english")}</SelectItem>
                <SelectItem value="te">{t("common.telugu")}</SelectItem>
              </SelectContent>
            </Select>
            <p className="mt-3 text-xs text-muted-foreground">{t("settings.languageNote")}</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
