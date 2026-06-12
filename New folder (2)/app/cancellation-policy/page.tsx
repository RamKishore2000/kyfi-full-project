"use client";

import { PolicyPageLayout } from "@/components/kyfi/policy-page-layout";

const sections = [
  {
    subtitle: "Plan type",
    title: "KYFI uses a yearly digital subscription",
    description:
      "Dealer access is provided as a yearly digital subscription plan. The plan gives access to KYFI dealer features for the active subscription period.",
  },
  {
    subtitle: "Cancellation",
    title: "Stopping use does not create a partial refund",
    description:
      "A dealer may stop using KYFI at any time, but active yearly subscription access cannot be cancelled for a partial refund after activation.",
  },
  {
    subtitle: "Validity",
    title: "Access continues until expiry",
    description:
      "Subscription access remains valid until the expiry date unless the account is suspended because of misuse, false records, fake proof, or platform rule violations.",
  },
  {
    subtitle: "Renewal",
    title: "Renewal is required after expiry",
    description:
      "After the subscription expiry date, the dealer must renew the plan to continue using KYFI dealer features.",
  },
];

export default function CancellationPolicyPage() {
  return (
    <PolicyPageLayout
      kicker="KYFI cancellation policy"
      title="Cancellation Policy"
      description="This policy explains how cancellation and subscription validity work for KYFI yearly digital dealer access."
      sections={sections}
    />
  );
}
