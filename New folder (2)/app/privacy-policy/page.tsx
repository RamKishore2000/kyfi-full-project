"use client";

import { Footer } from "@/components/kyfi/footer";
import { Header } from "@/components/kyfi/header";
import { Badge } from "@/components/ui/badge";

const sections = [
  {
    title: "Information KYFI collects",
    items: [
      "Dealer account details such as shop name, owner name, mobile number, location, Aadhaar number, GST number, subscription status, and approval status.",
      "New Farmer records added by a dealer, including farmer name, mobile number, Aadhaar number, location, and GREEN / YELLOW / RED payment status.",
      "Old Farmer records added with proof image, vote count, voter details, and dealer vote proof images.",
      "Search, vote, and record activity needed to show each dealer their own records and protect against duplicate or risky farmer entries.",
    ],
  },
  {
    title: "How KYFI uses this information",
    items: [
      "To help dealers search farmers before giving credit or products.",
      "To show Old Farmer risk details, vote count, dealer votes, and proof images.",
      "To maintain New Farmer records for each dealer and apply status rules for GREEN, YELLOW, and RED records.",
      "To manage dealer registration, subscription, login access, approval status, and admin review.",
    ],
  },
  {
    title: "Data visibility and protection",
    items: [
      "Only approved and subscribed dealers can access the dealer-side KYFI features.",
      "Aadhaar numbers are masked where possible in the user interface.",
      "Old Farmer vote details are shown to help dealers make safer credit decisions.",
      "Proof images are stored only for farmer record or vote verification and should be uploaded only when relevant.",
    ],
  },
  {
    title: "Dealer responsibilities",
    items: [
      "Dealers must add accurate farmer details and upload genuine proof images.",
      "Dealers must not misuse KYFI data for harassment, public sharing, or unrelated purposes.",
      "New Farmer status should be used correctly: GREEN for paid, YELLOW for partial payment, and RED for unpaid.",
      "Old Farmer records should be added only when the farmer repeatedly takes credit or products and does not pay properly.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="kyfi-shell min-h-screen">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <p className="font-manrope type-small uppercase tracking-[0.2em] text-emerald-700">
            KYFI privacy policy
          </p>
          <h1 className="mt-3 font-manrope type-section text-slate-900">
            Privacy Policy
          </h1>
          <p className="mt-4 font-manrope type-body text-slate-600">
            KYFI is a dealer-powered farmer credit reputation platform. This
            policy explains how dealer, farmer, vote, proof image, and
            subscription information is collected and used inside the platform.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {sections.map((section) => (
            <article
              key={section.title}
              className="rounded-3xl border border-white/80 bg-white/85 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-manrope type-card text-slate-900">
                  {section.title}
                </h2>
                <Badge variant="secondary">KYFI</Badge>
              </div>
              <ul className="mt-4 space-y-3 font-manrope type-body text-slate-600">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[rgb(4,120,87)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50/70 p-6">
          <p className="font-manrope type-nav text-emerald-900">
            Important
          </p>
          <p className="mt-2 font-manrope type-body text-slate-700">
            KYFI is used to support dealer credit decisions. Dealers remain
            responsible for verifying farmer details and making their own final
            business decision before giving credit or products.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
