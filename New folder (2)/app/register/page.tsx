"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Smartphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { registerDealer } from "@/lib/api/auth";
import { useKyfiLanguage } from "@/components/kyfi/language-provider";

type RegisterForm = {
  shopName: string;
  ownerName: string;
  mobile: string;
  password: string;
  district: string;
  state: string;
  mandal: string;
  village: string;
  aadhaarOrGstNumber: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useKyfiLanguage();
  const [form, setForm] = useState<RegisterForm>({
    shopName: "",
    ownerName: "",
    mobile: "",
    password: "",
    district: "",
    state: "",
    mandal: "",
    village: "",
    aadhaarOrGstNumber: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const mobilePattern = /^[6-9]\d{9}$/;
  const aadhaarPattern = /^\d{12}$/;
  const gstPattern = /^\d{2}[A-Z0-9]{13}$/;

  const handleChange =
    (field: keyof RegisterForm) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!mobilePattern.test(form.mobile.trim())) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    const identifier = form.aadhaarOrGstNumber.trim().toUpperCase();
    const isValidAadhaar = aadhaarPattern.test(identifier);
    const isValidGst = gstPattern.test(identifier);

    if (!isValidAadhaar && !isValidGst) {
      setError("Enter a valid Aadhaar number or GST number.");
      return;
    }

    setIsSubmitting(true);

    try {
      await registerDealer({
          shopName: form.shopName.trim(),
          ownerName: form.ownerName.trim(),
          mobile: form.mobile.trim(),
          password: form.password.trim() || undefined,
          district: form.district.trim(),
          state: form.state.trim(),
          mandal: form.mandal.trim(),
          village: form.village.trim(),
          aadhaarOrGstNumber: identifier,
      });

      router.push("/login");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Registration failed",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(22,101,52,0.12),_transparent_26%),linear-gradient(180deg,#f8fafc_0%,#eef7ef_100%)] px-0 py-0">
      <section className="flex min-h-screen w-full items-stretch overflow-hidden">
        <div className="sticky top-0 hidden h-screen self-stretch lg:block lg:w-1/2">
          <img
            src="/loginbanner.png"
            alt="KYFI dealer illustration"
            className="h-full w-full object-cover object-center"
          />
        </div>

        <div className="flex h-screen w-full items-start justify-center overflow-y-auto bg-white px-4 py-6 lg:w-1/2 lg:px-8">
          <Card className="mt-2 w-full max-w-[31rem] border-white/80 bg-white/90 shadow-[0_20px_80px_rgba(15,23,42,0.12)] backdrop-blur">
            <CardContent className="space-y-4 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-700 text-xs font-extrabold tracking-[0.12em] text-white shadow-sm">
                  KY
                </div>
                <div className="min-w-0">
                  <p className="font-manrope text-[1rem] font-extrabold tracking-[-0.03em] text-slate-900">
                    KYFI
                  </p>
                  <p className="font-manrope type-small uppercase tracking-[0.2em] text-slate-500">
                    Know Your Farmer Information
                  </p>
                </div>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-manrope type-nav uppercase tracking-[0.22em] text-emerald-800">
                    {t("register.dealerAccess")}
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                  <Smartphone className="h-5 w-5" />
                </div>
              </div>

              <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
                <Link
                  href="/login"
                  className="rounded-xl px-4 py-2.5 text-center text-sm font-semibold text-slate-500 transition hover:text-slate-800"
                >
                  {t("register.login")}
                </Link>
                <button
                  type="button"
                  className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 shadow-sm"
                >
                  {t("register.register")}
                </button>
              </div>

              <form className="space-y-3" onSubmit={handleSubmit}>
                <div className="grid gap-3">
                  <div className="space-y-2">
                    <label className="font-manrope type-nav text-slate-800">
                      {t("register.shopName")}
                    </label>
                    <Input
                      placeholder="Enter shop name"
                      value={form.shopName}
                      onChange={handleChange("shopName")}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="font-manrope type-nav text-slate-800">
                      {t("register.ownerName")}
                    </label>
                    <Input
                      placeholder="Enter owner name"
                      value={form.ownerName}
                      onChange={handleChange("ownerName")}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="font-manrope type-nav text-slate-800">
                      {t("register.mobile")}
                    </label>
                    <Input
                      placeholder="Enter mobile number"
                      inputMode="tel"
                      maxLength={10}
                      value={form.mobile}
                      onChange={handleChange("mobile")}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="font-manrope type-nav text-slate-800">
                      {t("register.passwordOptional")}
                    </label>
                    <Input
                      type="password"
                      placeholder="Enter password if you want to set one"
                      value={form.password}
                      onChange={handleChange("password")}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="font-manrope type-nav text-slate-800">
                      {t("register.district")}
                    </label>
                    <Input
                      placeholder="Enter district"
                      value={form.district}
                      onChange={handleChange("district")}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="font-manrope type-nav text-slate-800">
                      {t("register.state")}
                    </label>
                    <Input
                      placeholder="Enter state"
                      value={form.state}
                      onChange={handleChange("state")}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="font-manrope type-nav text-slate-800">
                      {t("register.mandal")}
                    </label>
                    <Input
                      placeholder="Enter mandal"
                      value={form.mandal}
                      onChange={handleChange("mandal")}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="font-manrope type-nav text-slate-800">
                      {t("register.village")}
                    </label>
                    <Input
                      placeholder="Enter village"
                      value={form.village}
                      onChange={handleChange("village")}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="font-manrope type-nav text-slate-800">
                      {t("register.identifier")}
                    </label>
                    <Input
                      placeholder="Enter Aadhaar or GST number"
                      maxLength={15}
                      value={form.aadhaarOrGstNumber}
                      onChange={handleChange("aadhaarOrGstNumber")}
                      required
                    />
                    <p className="font-manrope type-small text-slate-500">
                      Aadhaar: 12 digits. GST: 15-character GSTIN.
                    </p>
                  </div>
                </div>

                {error ? <p className="font-manrope type-small text-red-600">{error}</p> : null}

                <Button size="lg" className="w-full" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Registering..." : t("register.submit")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

