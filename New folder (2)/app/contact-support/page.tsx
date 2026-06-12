"use client";

import { PolicyPageLayout } from "@/components/kyfi/policy-page-layout";

const sections = [
  {
    subtitle: "Email",
    title: "Support email",
    description:
      "For KYFI account, subscription, payment, approval, or access support, contact smartdealers916@gmail.com.",
  },
  {
    subtitle: "Mobile",
    title: "Support mobile number",
    description:
      "Dealers can contact KYFI support at 8886000815 and should share their registered mobile number for faster checking.",
  },
  {
    subtitle: "Region",
    title: "Current service area",
    description:
      "KYFI is currently designed for pesticide and agri-input dealers in Andhra Pradesh and Telangana.",
  },
  {
    subtitle: "Payment help",
    title: "What to share for payment support",
    description:
      "For payment or subscription activation issues, share registered mobile number, payment date, payment amount, and transaction or Razorpay payment details if available.",
  },
];

export default function ContactSupportPage() {
  return (
    <PolicyPageLayout
      kicker="KYFI support"
      title="Contact and Support"
      description="Use these contact details for dealer account, subscription, payment, approval, and platform access support."
      sections={sections}
    />
  );
}
