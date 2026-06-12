"use client";

import { PolicyPageLayout } from "@/components/kyfi/policy-page-layout";

const sections = [
  {
    subtitle: "No shipping",
    title: "KYFI is a digital subscription platform",
    description:
      "KYFI does not ship any physical product. Dealer access is provided digitally through the KYFI website and mobile app experience.",
  },
  {
    subtitle: "Activation",
    title: "Access is activated after successful payment",
    description:
      "After successful payment verification, dealer subscription access is activated digitally for the yearly plan period.",
  },
  {
    subtitle: "Login access",
    title: "Dealers use their registered account",
    description:
      "Dealers access KYFI using their registered mobile number and login credentials or OTP flow, based on the available login method.",
  },
  {
    subtitle: "Support",
    title: "Delayed activation can be reported",
    description:
      "If payment is successful but access is not activated because of verification or technical delay, the dealer can contact KYFI support with the registered mobile number and payment details.",
  },
];

export default function DigitalServiceDeliveryPage() {
  return (
    <PolicyPageLayout
      kicker="KYFI digital delivery"
      title="Digital Service Delivery Policy"
      description="This policy explains how KYFI dealer subscription access is delivered digitally after payment."
      sections={sections}
      note={{
        title: "Digital-only service",
        description:
          "No courier, shipping, or physical delivery is involved in KYFI subscription access.",
      }}
    />
  );
}
