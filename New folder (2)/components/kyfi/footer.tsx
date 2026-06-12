"use client";

import { useKyfiLanguage } from "@/components/kyfi/language-provider";

export function Footer() {
  const { t } = useKyfiLanguage();

  return (
    <footer id="contact" className="hidden border-t border-border bg-white/80 sm:block">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-3 lg:px-8 max-sm:px-3 max-sm:py-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <img
              src="/kyfi-logo.png"
              alt="KYFI"
              className="h-20 w-auto object-contain"
            />
          </div>
          <p className="max-w-md font-manrope type-body">
            {t("footer.description")}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:col-span-2">
          <div className="space-y-3">
            <p className="font-manrope type-nav text-slate-900">
              {t("footer.links")}
            </p>
            <ul className="space-y-2 font-manrope type-body text-slate-600">
              <li>
                <a
                  className="font-manrope type-nav text-slate-600 transition hover:text-primary"
                  href="/"
                >
                  {t("footer.home")}
                </a>
              </li>
              <li>
                <a
                  className="font-manrope type-nav text-slate-600 transition hover:text-primary"
                  href="/search-farmer-status"
                >
                  {t("footer.search")}
                </a>
              </li>
              <li>
                <a
                  className="font-manrope type-nav text-slate-600 transition hover:text-primary"
                  href="/add-farmer-status"
                >
                  {t("footer.addStatus")}
                </a>
              </li>
              {/*
              <li>
                <a className="font-manrope type-nav text-slate-600 transition hover:text-primary" href="/add-to-blacklist">
                  {t("footer.blacklist")}
                </a>
              </li>
              <li>
                <a className="font-manrope type-nav text-slate-600 transition hover:text-primary" href="/blacklist-browser">
                  {t("footer.browser")}
                </a>
              </li>
              */}
            </ul>
          </div>
          <div className="space-y-3">
            <p className="font-manrope type-nav text-slate-900">
              {t("footer.policies")}
            </p>
            <ul className="space-y-2 font-manrope type-body text-slate-600">
              <li>
                <a
                  className="font-manrope type-nav text-slate-600 transition hover:text-primary"
                  href="/privacy-policy"
                >
                  {t("footer.privacy")}
                </a>
              </li>
              <li>
                <a
                  className="font-manrope type-nav text-slate-600 transition hover:text-primary"
                  href="/terms-of-use"
                >
                  {t("footer.terms")}
                </a>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <p className="font-manrope type-nav text-slate-900">
              {t("footer.contact")}
            </p>
            <ul className="space-y-2 font-manrope type-body text-slate-600">
              <li>{t("footer.apTs")}</li>
              <li>{t("footer.support")}</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-border/80 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-4 font-manrope type-body text-slate-600 sm:px-6 lg:px-8 max-sm:px-3 max-sm:py-3">
          {t("footer.copyright")}
        </div>
      </div>
    </footer>
  );
}
