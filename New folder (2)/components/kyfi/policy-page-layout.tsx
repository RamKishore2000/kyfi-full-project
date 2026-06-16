"use client";

import { AppBackButton } from "@/components/kyfi/app-back-button";
import { Footer } from "@/components/kyfi/footer";
import { Header } from "@/components/kyfi/header";
import { useKyfiLanguage } from "@/components/kyfi/language-provider";

type PolicySection = {
  title: string;
  subtitle: string;
  description: string;
};

type PolicyPageLayoutProps = {
  kicker: string;
  title: string;
  description: string;
  sections: PolicySection[];
  note?: {
    title: string;
    description: string;
  };
};

export function PolicyPageLayout({
  kicker,
  title,
  description,
  sections,
  note,
}: PolicyPageLayoutProps) {
  const { translateText } = useKyfiLanguage();

  return (
    <main className="kyfi-shell min-h-screen">
      <Header />
      <AppBackButton />

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="max-w-3xl">
          <p className="font-manrope type-small uppercase tracking-[0.22em] text-emerald-700">
            {translateText(kicker)}
          </p>
          <h1 className="mt-3 font-manrope type-section text-slate-950">
            {translateText(title)}
          </h1>
          <p className="mt-4 font-manrope type-body text-slate-600">
            {translateText(description)}
          </p>
        </div>

        <div className="relative mt-10 space-y-0">
          {sections.map((section, index) => (
            <article
              key={section.title}
              className="relative grid grid-cols-[3rem_1fr] gap-4 py-5 sm:grid-cols-[4.5rem_1fr] sm:gap-6"
            >
              <div className="relative flex justify-center sm:justify-start">
                {index < sections.length - 1 ? (
                  <span className="absolute left-1/2 top-9 h-[calc(100%+2.5rem)] w-px -translate-x-1/2 bg-gradient-to-b from-[rgb(4,120,87)] via-emerald-200 to-emerald-100 sm:left-6 sm:top-10 sm:h-[calc(100%+2rem)] sm:translate-x-0" />
                ) : null}
                <div className="relative z-10 flex h-9 w-9 items-center justify-center bg-[rgb(246,250,247)] font-manrope text-sm font-black text-[rgb(4,120,87)] sm:h-12 sm:w-12 sm:text-base">
                  {String(index + 1).padStart(2, "0")}
                </div>
              </div>
              <div>
                <p className="font-manrope text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                  {translateText(section.subtitle)}
                </p>
                <h2 className="mt-2 font-manrope text-2xl font-black tracking-[-0.03em] text-slate-950">
                  {translateText(section.title)}
                </h2>
                <p className="mt-3 font-manrope type-body leading-relaxed text-slate-650">
                  {translateText(section.description)}
                </p>
              </div>
            </article>
          ))}
        </div>

        {note ? (
          <div className="mt-8 border-l-4 border-[rgb(4,120,87)] bg-emerald-50/70 px-5 py-4">
            <p className="font-manrope type-nav text-emerald-900">
              {translateText(note.title)}
            </p>
            <p className="mt-2 font-manrope type-body text-slate-700">
              {translateText(note.description)}
            </p>
          </div>
        ) : null}
      </section>

      <Footer />
    </main>
  );
}
