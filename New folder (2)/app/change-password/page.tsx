import { Footer } from "@/components/kyfi/footer";
import { Header } from "@/components/kyfi/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ChangePasswordPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="font-manrope type-small uppercase tracking-[0.2em] text-emerald-700">
            Change Password
          </p>
          <h1 className="mt-3 font-manrope type-section text-slate-900">
            Update your dealer password
          </h1>
          <p className="mt-4 font-manrope type-body text-slate-600">
            Use this screen to change your password after dealer approval.
          </p>
        </div>

        <div className="mx-auto flex max-w-7xl justify-center">
          <Card className="w-full max-w-2xl bg-white">
          <CardContent className="space-y-6 p-6 sm:p-8">
            <div className="space-y-2">
              <label className="font-manrope type-nav text-slate-800">
                Current password
              </label>
              <Input type="password" placeholder="Enter current password" />
            </div>

            <div className="space-y-2">
              <label className="font-manrope type-nav text-slate-800">
                New password
              </label>
              <Input type="password" placeholder="Enter new password" />
            </div>

            <div className="space-y-2">
              <label className="font-manrope type-nav text-slate-800">
                Confirm new password
              </label>
              <Input type="password" placeholder="Confirm new password" />
            </div>

            <Button size="lg" className="w-full sm:w-auto">
              Update Password
            </Button>
          </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </main>
  );
}
