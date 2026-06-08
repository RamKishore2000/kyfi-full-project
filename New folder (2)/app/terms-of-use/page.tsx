"use client";

import { Footer } from "@/components/kyfi/footer";
import { Header } from "@/components/kyfi/header";
import { Badge } from "@/components/ui/badge";

const sections = [
  {
    title: "Who can use KYFI",
    items: [
      "KYFI is intended for pesticide and agri-input dealers who need to check farmer credit reputation before giving credit or products.",
      "Dealer accounts must be registered, subscribed, and approved before accessing dealer features.",
      "Admins and Super Admins may review dealer accounts, farmers, votes, subscriptions, banners, and platform operations based on their permissions.",
    ],
  },
  {
    title: "New Farmer records",
    items: [
      "New Farmer records are maintained by the dealer who added them.",
      "GREEN means the farmer paid properly, YELLOW means partial payment, and RED means unpaid.",
      "If a farmer has YELLOW or RED status from any dealer, KYFI may restrict another dealer from adding that farmer as a new record.",
      "A dealer can update their New Farmer status and move risky YELLOW or RED records to Old Farmers where applicable.",
    ],
  },
  {
    title: "Old Farmer records and votes",
    items: [
      "Old Farmers are farmers who repeatedly take credit or products from dealers but do not pay properly.",
      "Old Farmer records may require proof images and can show vote count, dealer details, and vote proof images.",
      "Dealers must vote only when they have genuine knowledge or proof about that farmer.",
      "Vote information is used to help other dealers identify risky or non-paying farmers before giving credit.",
    ],
  },
  {
    title: "Platform rules",
    items: [
      "Do not add false farmer records, fake proof images, or misleading votes.",
      "Do not share another dealer's data outside KYFI for unrelated purposes.",
      "Do not attempt to bypass subscription, approval, login, or admin permission controls.",
      "KYFI does not collect payments from farmers and does not guarantee farmer repayment.",
    ],
  },
];

export default function TermsOfUsePage() {
  return (
    <main className="kyfi-shell min-h-screen">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <p className="font-manrope type-small uppercase tracking-[0.2em] text-emerald-700">
            KYFI usage rules
          </p>
          <h1 className="mt-3 font-manrope type-section text-slate-900">
            Terms of Use
          </h1>
          <p className="mt-4 font-manrope type-body text-slate-600">
            These terms explain how dealers, admins, and Super Admins should use
            KYFI for New Farmer records, Old Farmer risk records, dealer votes,
            proof images, subscriptions, and account access.
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

        <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50/70 p-6">
          <p className="font-manrope type-nav text-amber-900">Reminder</p>
          <p className="mt-2 font-manrope type-body text-slate-700">
            KYFI provides shared dealer reputation information. It is not a
            legal recovery system, payment guarantee, or final credit approval
            authority. Each dealer must make their own credit decision.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
