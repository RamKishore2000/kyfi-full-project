"use client";

import { PolicyPageLayout } from "@/components/kyfi/policy-page-layout";

const sections = [
  {
    subtitle: "Plan",
    title: "One Year Plan",
    description:
      "KYFI provides yearly digital subscription access for dealers who need farmer search, New Farmer records, Old Farmer records, vote visibility, and account tools.",
  },
  {
    subtitle: "Price",
    title: "Final price is shown before payment",
    description:
      "The active yearly subscription price is shown on the KYFI subscription section or payment page before the dealer completes payment.",
  },
  {
    subtitle: "Duration",
    title: "Subscription is valid for one full year",
    description:
      "The yearly plan remains active for one full year from successful subscription activation, unless the account is suspended because of platform misuse.",
  },
  {
    subtitle: "Access",
    title: "Subscription works with dealer approval",
    description:
      "Dealer access is provided after successful payment, subscription activation, and account approval where KYFI admin review is required.",
  },
];

export default function SubscriptionPricingPage() {
  return (
    <PolicyPageLayout
      kicker="KYFI subscription"
      title="Subscription Pricing"
      description="This page explains how KYFI's yearly dealer subscription price and access period are shown to dealers."
      sections={sections}
    />
  );
}
