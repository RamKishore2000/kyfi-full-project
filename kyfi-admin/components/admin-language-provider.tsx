"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getAdminText, type AdminLanguage, translateAdminText } from "@/lib/admin-i18n";

type AdminLanguageContextValue = {
  language: AdminLanguage;
  setLanguage: (language: AdminLanguage) => void;
  t: (key: string) => string;
  translateText: (value: string) => string;
};

const AdminLanguageContext = createContext<AdminLanguageContextValue | null>(null);

const STORAGE_KEY = "kyfi_admin_language";

export function AdminLanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AdminLanguage>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "te") {
      setLanguageState(stored);
      document.documentElement.lang = stored;
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<AdminLanguageContextValue>(
    () => ({
      language,
      setLanguage: setLanguageState,
      t: (key: string) => getAdminText(language, key),
      translateText: (value: string) => translateAdminText(language, value),
    }),
    [language],
  );

  return <AdminLanguageContext.Provider value={value}>{children}</AdminLanguageContext.Provider>;
}

export function useAdminLanguage() {
  const context = useContext(AdminLanguageContext);
  if (!context) {
    throw new Error("useAdminLanguage must be used within AdminLanguageProvider");
  }
  return context;
}
