"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { fetchCurrentDealer } from "@/lib/api/profile";
import { translate } from "@/lib/kyfi-i18n";
import type { KyfiLanguage } from "@/lib/kyfi-i18n";
import { translateRuntimeText } from "@/lib/kyfi-runtime-message";

type LanguageContextValue = {
  language: KyfiLanguage;
  setLanguage: (language: KyfiLanguage) => void;
  t: (key: string) => string;
  translateText: (text: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined
);

function translateDom(language: KyfiLanguage) {
  if (typeof document === "undefined" || language !== "te") {
    return;
  }

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;

        const tagName = parent.tagName.toLowerCase();
        if (
          ["script", "style", "noscript", "svg", "path"].includes(tagName) ||
          parent.closest("[data-kyfi-no-translate='true']")
        ) {
          return NodeFilter.FILTER_REJECT;
        }

        if (!node.nodeValue || !node.nodeValue.trim()) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  const nodes: Text[] = [];
  while (walker.nextNode()) {
    nodes.push(walker.currentNode as Text);
  }

  for (const node of nodes) {
    const nextValue = translateRuntimeText(node.nodeValue ?? "", language);
    if (nextValue !== node.nodeValue) {
      node.nodeValue = nextValue;
    }
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<KyfiLanguage>("en");
  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    let cancelled = false;

    const syncLanguage = async () => {
      const token =
        typeof window !== "undefined"
          ? window.localStorage.getItem("kyfi_token")
          : null;

      if (!token) {
        if (!cancelled) {
          setLanguage("en");
        }
        return;
      }

      try {
        const dealer = await fetchCurrentDealer();
        if (cancelled) return;

        const nextLanguage =
          dealer?.dealer?.languagePreference === "te" ? "te" : "en";
        setLanguage(nextLanguage);
      } catch {
        if (!cancelled) {
          setLanguage("en");
        }
      }
    };

    syncLanguage();

    const handleAuthChange = () => {
      syncLanguage();
    };

    window.addEventListener("kyfi-auth-changed", handleAuthChange);

    return () => {
      cancelled = true;
      window.removeEventListener("kyfi-auth-changed", handleAuthChange);
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;

    document.documentElement.lang = language;
    translateDom(language);

    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (language !== "te") {
      return;
    }

    const observer = new MutationObserver(() => {
      translateDom(language);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    observerRef.current = observer;

    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key: string) => translate(language, key),
      translateText: (text: string) => translateRuntimeText(text, language),
    }),
    [language]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useKyfiLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useKyfiLanguage must be used within a LanguageProvider");
  }

  return context;
}
