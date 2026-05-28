import { Footer } from "@/components/kyfi/footer";
import { Header } from "@/components/kyfi/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="font-manrope type-small uppercase tracking-[0.2em] text-emerald-700">
            Profile / Settings
          </p>
          <h1 className="mt-3 font-manrope type-section text-slate-900">
            Dealer profile and settings
          </h1>
          <p className="mt-4 font-manrope type-body text-slate-600">
            Only the document fields are shown here. This screen is for approved dealers.
          </p>
        </div>

        <div className="grid gap-6">
          <Card className="bg-white">
            <CardContent className="space-y-6 p-6 sm:p-8">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="font-manrope type-nav text-slate-800">Dealer name</label>
                  <Input defaultValue="Suresh Agro Center" />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="font-manrope type-nav text-slate-800">Shop name</label>
                  <Input defaultValue="Suresh Agro Center" />
                </div>

                <div className="space-y-2">
                  <label className="font-manrope type-nav text-slate-800">Mobile number</label>
                  <Input defaultValue="9876543210" inputMode="tel" />
                </div>

                <div className="space-y-2">
                  <label className="font-manrope type-nav text-slate-800">District</label>
                  <Input defaultValue="Guntur" />
                </div>

                <div className="space-y-2">
                  <label className="font-manrope type-nav text-slate-800">Mandal</label>
                  <Input defaultValue="Guntur Rural" />
                </div>

                <div className="space-y-2">
                  <label className="font-manrope type-nav text-slate-800">Village</label>
                  <Input defaultValue="Maddur" />
                </div>
              </div>

              <Button size="lg" className="w-full sm:w-auto">
                Update Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </main>
  );
}
