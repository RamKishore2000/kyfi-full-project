"use client";

import { PolicyPageLayout } from "@/components/kyfi/policy-page-layout";

const sections = [
  {
    subtitle: "Subscription payment",
    title: "Yearly digital access fee",
    description:
      "KYFI subscription payments are collected for yearly digital dealer access to farmer search, farmer record management, vote visibility, and related dealer tools.",
  },
  {
    subtitle: "General rule",
    title: "Activated subscriptions are non-refundable",
    description:
      "Once payment is successful and dealer subscription access is activated, the yearly subscription fee is generally non-refundable.",
  },
  {
    subtitle: "Eligible cases",
    title: "When a refund may be reviewed",
    description:
      "A refund may be considered if payment is deducted but access is not activated, duplicate payment is made for the same dealer account, or KYFI cannot resolve a verified technical access issue.",
  },
  {
    subtitle: "Timeline",
    title: "Approved refund processing time",
    description:
      "If a refund is approved, it will be processed to the original payment method within 7 to 10 working days, depending on bank and payment gateway processing time.",
  },
  {
    subtitle: "Misuse",
    title: "Refunds are not provided for policy violations",
    description:
      "No refund will be provided if the account is suspended for misuse, false farmer records, fake proof images, misleading votes, or violation of KYFI platform rules.",
  },
];

export default function RefundPolicyPage() {
  return (
    <PolicyPageLayout
      kicker="KYFI refund policy"
      title="Refund Policy"
      description="This policy explains refund rules for KYFI's yearly digital subscription access for dealers."
      sections={sections}
    />
  );
}
