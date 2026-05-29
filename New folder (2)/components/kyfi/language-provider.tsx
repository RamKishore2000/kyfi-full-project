"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { KyfiLanguage } from "@/lib/kyfi-i18n";
import { translate } from "@/lib/kyfi-i18n";

type LanguageContextValue = {
  language: KyfiLanguage;
  setLanguage: (language: KyfiLanguage) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<KyfiLanguage>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem("kyfi_language");
    if (stored === "te" || stored === "en") {
      setLanguageState(stored);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("kyfi_language", language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage: setLanguageState,
      t: (key: string) => translate(language, key),
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useKyfiLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useKyfiLanguage must be used within LanguageProvider");
  }

  return context;
}
