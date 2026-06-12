"use client";

import { PolicyPageLayout } from "@/components/kyfi/policy-page-layout";

const sections = [
  {
    subtitle: "Dealer access",
    title: "Who can use KYFI",
    description:
      "KYFI is for pesticide and agri-input dealers who need to check farmer credit reputation before giving credit or products. Dealer accounts must be registered, subscribed, and approved where required.",
  },
  {
    subtitle: "New Farmer records",
    title: "How New Farmer status should be used",
    description:
      "New Farmer records are maintained by the dealer who added them. GREEN means paid, YELLOW means partial payment, and RED means unpaid. Dealers must use these statuses honestly and only for their own farmer records.",
  },
  {
    subtitle: "Old Farmer records",
    title: "How Old Farmer reputation records work",
    description:
      "Old Farmers are farmers who repeatedly take credit or products from dealers and do not pay properly. Old Farmer records can include vote count, dealer vote details, and proof images to help other dealers avoid risky credit decisions.",
  },
  {
    subtitle: "Misuse rules",
    title: "What is not allowed",
    description:
      "Dealers must not create false farmer records, upload fake proof images, misuse another dealer's data, bypass subscription or approval rules, or use KYFI for harassment or public sharing.",
  },
  {
    subtitle: "Limitations",
    title: "KYFI is not a repayment guarantee",
    description:
      "KYFI provides shared dealer reputation information. It is not a legal recovery service, payment collection service, or guarantee that a farmer will repay credit.",
  },
];

export default function TermsOfUsePage() {
  return (
    <PolicyPageLayout
      kicker="KYFI usage rules"
      title="Terms of Use"
      description="These terms explain how dealers, admins, and Super Admins should use KYFI for farmer records, votes, proof images, subscriptions, and account access."
      sections={sections}
      note={{
        title: "Dealer decision",
        description:
          "KYFI helps with reputation checking. The final decision to give credit or products always belongs to the dealer.",
      }}
    />
  );
}
