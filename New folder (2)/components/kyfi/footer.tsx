"use client";

import { Leaf } from "lucide-react";
import { useKyfiLanguage } from "@/components/kyfi/language-provider";

export function Footer() {
  const { t } = useKyfiLanguage();

  return (
    <footer id="contact" className="border-t border-border bg-white/80">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgb(4,120,87)] text-white shadow-[0_12px_24px_rgba(4,120,87,0.22)]">
              <Leaf className="h-6 w-6" />
            </div>
            <div>
              <div className="font-manrope text-[1.06rem] font-extrabold tracking-[-0.03em] text-[rgb(4,120,87)]">
                KYFI
              </div>
              <div className="font-manrope text-[0.74rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {t("header.subtitle")}
              </div>
            </div>
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
                  href="/dashboard"
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
        <div className="mx-auto max-w-7xl px-4 py-4 font-manrope type-body text-slate-600 sm:px-6 lg:px-8">
          {t("footer.copyright")}
        </div>
      </div>
    </footer>
  );
}
