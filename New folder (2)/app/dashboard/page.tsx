import { Header } from "@/components/kyfi/header";
import { AuthGuard } from "@/components/kyfi/auth-guard";
import { HeroBanner } from "@/components/kyfi/hero-banner";
import { FeatureCard } from "@/components/kyfi/feature-card";
import { HowItWorks } from "@/components/kyfi/how-it-works";
import { DashboardPreview } from "@/components/kyfi/dashboard-preview";
import { StatusCard } from "@/components/kyfi/status-card";
import { CTASection } from "@/components/kyfi/cta-section";
import { Footer } from "@/components/kyfi/footer";
import { BarChart3, CirclePlus, Search, ShieldAlert, Users } from "lucide-react";

const features = [
  {
    icon: <Search className="h-5 w-5" />,
    title: "Farmer Status Search",
    description:
      "Search using Aadhaar, PAN, mobile number, or farmer name to quickly check repayment reputation.",
    href: "/search-farmer-status",
  },
  {
    icon: <CirclePlus className="h-5 w-5" />,
    title: "Add Farmer Status",
    description:
      "Create a simple GREEN, YELLOW, or RED reputation record for a farmer using Aadhaar as the primary identifier.",
    href: "/add-farmer-status",
  },
  {
    icon: <ShieldAlert className="h-5 w-5" />,
    title: "Farmer Blacklist",
    description:
      "View confirmed non-payment records by Mandal and Village before making credit decisions.",
    href: "/blacklist-browser",
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: "Dealer Voting",
    description:
      "Dealers can vote once on existing farmer records to support shared community validation.",
  },
  {
    icon: <ShieldAlert className="h-5 w-5" />,
    title: "Add to Blacklist",
    description:
      "Create a confirmed unpaid dues warning for a farmer when the record needs to be added to the blacklist.",
    href: "/add-to-blacklist",
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: "My Records",
    description:
      "Dealers can view and update farmer records they have personally added.",
    href: "/my-records",
  },
];

export default function DashboardPage() {
  return (
    <AuthGuard>
      <main className="min-h-screen kyfi-shell">
        <Header />
        <HeroBanner />

        <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="kyfi-section-kicker">Features</p>
            <h2 className="mt-4 font-manrope text-[clamp(1.9rem,3vw,3rem)] font-extrabold tracking-[-0.04em] text-slate-900">
              Core tools designed for practical dealer decisions
            </h2>
            <p className="mt-4 max-w-2xl text-[1rem] leading-8 text-slate-600">
              The interface stays simple, readable, and grounded in dealer workflows rather than technical jargon.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} {...feature} index={index} />
            ))}
          </div>
        </section>

        <DashboardPreview />

        <HowItWorks />

        <section id="status" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="kyfi-section-kicker">Farmer status</p>
            <h2 className="mt-4 font-manrope text-[clamp(1.9rem,3vw,3rem)] font-extrabold tracking-[-0.04em] text-slate-900">
              Three simple signals for repayment reputation
            </h2>
            <p className="mt-4 max-w-2xl text-[1rem] leading-8 text-slate-600">
              These status cards help dealers quickly understand repayment behavior before extending credit.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <StatusCard
              status="GREEN"
              title="Good Repayment Record"
              text="Safe to extend credit as usual."
              index={0}
            />
            <StatusCard
              status="YELLOW"
              title="Delayed Payments"
              text="Proceed with caution and consider smaller credit limits."
              index={1}
            />
            <StatusCard
              status="RED"
              title="Confirmed Defaulter"
              text="Avoid credit. Prefer cash transactions only."
              index={2}
            />
          </div>
        </section>

        <CTASection />

        <Footer />
      </main>
    </AuthGuard>
  );
}
