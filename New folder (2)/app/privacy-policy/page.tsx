"use client";

import { PolicyPageLayout } from "@/components/kyfi/policy-page-layout";

const sections = [
  {
    subtitle: "Dealer account data",
    title: "Information collected during dealer registration",
    description:
      "KYFI collects dealer shop name, owner name, mobile number, location, Aadhaar number, GST number, approval status, subscription status, and login activity to create and protect dealer access.",
  },
  {
    subtitle: "Farmer records",
    title: "Information stored for New Farmers and Old Farmers",
    description:
      "New Farmer records may include farmer name, mobile number, Aadhaar number, location, and GREEN, YELLOW, or RED payment status. Old Farmer records may include mobile number, location, vote count, proof images, and dealer vote details.",
  },
  {
    subtitle: "Platform usage",
    title: "How KYFI uses dealer and farmer data",
    description:
      "KYFI uses this data to help dealers search farmer reputation, identify risky Old Farmer records, maintain their own New Farmer records, show vote history, manage subscriptions, and support admin review.",
  },
  {
    subtitle: "Visibility",
    title: "What other dealers can see",
    description:
      "Approved and subscribed dealers can see relevant farmer reputation information such as old farmer details, vote counts, and vote proof where needed. Sensitive Aadhaar information is masked in the interface wherever possible.",
  },
  {
    subtitle: "Responsibility",
    title: "Dealer data responsibility",
    description:
      "Dealers must add correct farmer details, upload genuine proof images, and avoid sharing KYFI data outside the platform for harassment, public posting, or unrelated business purposes.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <PolicyPageLayout
      kicker="KYFI privacy policy"
      title="Privacy Policy"
      description="This policy explains how KYFI collects, uses, and protects dealer, farmer, vote, proof image, and subscription information inside the dealer-powered reputation platform."
      sections={sections}
      note={{
        title: "Important",
        description:
          "KYFI supports dealer credit decisions, but each dealer remains responsible for verifying farmer details before giving credit or products.",
      }}
    />
  );
}
