"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { Footer } from "@/components/kyfi/footer";
import { AuthGuard } from "@/components/kyfi/auth-guard";
import { Header } from "@/components/kyfi/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchCurrentDealer, updateCurrentDealerProfile } from "@/lib/api/profile";
import { useKyfiLanguage } from "@/components/kyfi/language-provider";

export default function ProfilePage() {
  const { t } = useKyfiLanguage();
  const [form, setForm] = useState({
    name: "",
    shopName: "",
    mobile: "",
    district: "",
    state: "",
    mandal: "",
    village: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetchCurrentDealer();
        const dealer = response.dealer;

        setForm({
          name: dealer.name ?? "",
          shopName: dealer.shopName ?? "",
          mobile: dealer.mobile ?? "",
          district: dealer.district ?? "",
          state: dealer.state ?? "",
          mandal: dealer.mandal ?? "",
          village: dealer.village ?? "",
        });
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load profile");
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, []);

  const handleChange = (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setError("");
    setMessage("");
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await updateCurrentDealerProfile({
        name: form.name.trim(),
        shopName: form.shopName.trim(),
        mobile: form.mobile.trim(),
        district: form.district.trim(),
        state: form.state.trim(),
        mandal: form.mandal.trim(),
        village: form.village.trim(),
      });

      const dealer = response.dealer;
      setForm({
        name: dealer.name ?? "",
        shopName: dealer.shopName ?? "",
        mobile: dealer.mobile ?? "",
        district: dealer.district ?? "",
        state: dealer.state ?? "",
        mandal: dealer.mandal ?? "",
        village: dealer.village ?? "",
      });
      setMessage(response.message || "Profile updated successfully");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthGuard>
      <main className="kyfi-shell min-h-screen">
        <Header />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="font-manrope type-small uppercase tracking-[0.2em] text-emerald-700">
            {t("profile.title")}
          </p>
          <h1 className="mt-3 font-manrope type-section text-slate-900">
            {t("profile.title")}
          </h1>
          <p className="mt-4 font-manrope type-body text-slate-600">
            Only the document fields are shown here. This screen is for approved dealers.
          </p>
        </div>

        {loading ? (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white/80 p-4 font-manrope type-body text-slate-600 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            Loading profile...
          </div>
        ) : null}

        {message ? (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-manrope type-body text-emerald-800">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-manrope type-body text-red-700">
            {error}
          </div>
        ) : null}

        <Card className="overflow-hidden border-white/80 bg-white/85 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <CardContent className="space-y-6 p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-manrope type-nav text-slate-900">Profile fields</p>
                <h2 className="mt-1 font-manrope type-card text-slate-900">
                  Dealer details
                </h2>
              </div>
              <Badge variant="secondary">Approved dealer</Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="font-manrope type-nav text-slate-800">Dealer name</label>
                <Input value={form.name} onChange={handleChange("name")} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="font-manrope type-nav text-slate-800">Shop name</label>
                <Input value={form.shopName} onChange={handleChange("shopName")} />
              </div>

              <div className="space-y-2">
                <label className="font-manrope type-nav text-slate-800">Mobile number</label>
                <Input value={form.mobile} onChange={handleChange("mobile")} inputMode="tel" />
              </div>

              <div className="space-y-2">
                <label className="font-manrope type-nav text-slate-800">State</label>
                <Input value={form.state} onChange={handleChange("state")} />
              </div>

              <div className="space-y-2">
                <label className="font-manrope type-nav text-slate-800">District</label>
                <Input value={form.district} onChange={handleChange("district")} />
              </div>

              <div className="space-y-2">
                <label className="font-manrope type-nav text-slate-800">Mandal</label>
                <Input value={form.mandal} onChange={handleChange("mandal")} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="font-manrope type-nav text-slate-800">Village</label>
                <Input value={form.village} onChange={handleChange("village")} />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                size="lg"
                className="w-full sm:w-auto sm:min-w-[280px] lg:min-w-[320px]"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? "Saving..." : t("profile.update")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

        <Footer />
      </main>
    </AuthGuard>
  );
}
