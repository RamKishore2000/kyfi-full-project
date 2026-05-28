import { Card, CardContent } from "@/components/ui/card";

export default function TermsOfUsePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl items-center px-4 py-16 sm:px-6 lg:px-8">
      <Card className="w-full bg-white">
        <CardContent className="space-y-4 p-8">
          <p className="font-manrope type-small uppercase tracking-[0.2em] text-emerald-700">
            KYFI
          </p>
          <h1 className="font-manrope type-section text-slate-900">
            Terms of Use
          </h1>
          <p className="font-manrope type-body">
            Placeholder legal page for the KYFI UI prototype. This can be expanded when the final terms are ready.
          </p>
          <a className="font-manrope type-nav text-emerald-700" href="/">
            Back to home
          </a>
        </CardContent>
      </Card>
    </main>
  );
}
