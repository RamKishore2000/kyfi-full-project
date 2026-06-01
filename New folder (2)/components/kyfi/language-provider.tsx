"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { KyfiLanguage } from "@/lib/kyfi-i18n";
import { translate } from "@/lib/kyfi-i18n";
import { fetchCurrentDealer } from "@/lib/api/profile";

type LanguageContextValue = {
  language: KyfiLanguage;
  setLanguage: (language: KyfiLanguage) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<KyfiLanguage>("en");
  const [authVersion, setAuthVersion] = useState(0);

  useEffect(() => {
    const handleAuthChange = () => {
      setAuthVersion((value) => value + 1);
    };

    window.addEventListener("kyfi-auth-changed", handleAuthChange);
    return () => window.removeEventListener("kyfi-auth-changed", handleAuthChange);
  }, []);

  useEffect(() => {
    const token = window.localStorage.getItem("kyfi_token");

    if (!token) {
      document.documentElement.lang = language;
      return;
    }

    let cancelled = false;

    void fetchCurrentDealer()
      .then((response) => {
        if (cancelled) return;

        const dealerLanguage = response.dealer?.languagePreference;
        if (dealerLanguage === "te" || dealerLanguage === "en") {
          setLanguageState(dealerLanguage);
        }
      })
      .catch(() => {
        // Fall back to English when the dealer profile cannot be loaded.
      });

    return () => {
      cancelled = true;
    };
  }, [authVersion]);

  useEffect(() => {
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
