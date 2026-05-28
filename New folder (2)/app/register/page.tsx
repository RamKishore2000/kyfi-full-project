"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Smartphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { registerDealer } from "@/lib/api/auth";

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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(22,101,52,0.12),_transparent_26%),linear-gradient(180deg,#f8fafc_0%,#eef7ef_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl items-center">
        <div className="grid w-full items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="hidden lg:block">
            <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/70 p-4 shadow-[0_24px_90px_rgba(15,23,42,0.12)] backdrop-blur">
              <img
                src="/dealer-login-illustration.svg"
                alt="KYFI dealer illustration"
                className="h-full w-full rounded-[1.5rem] object-cover"
              />
            </div>
          </div>

          <Card className="w-full border-white/80 bg-white/90 shadow-[0_20px_80px_rgba(15,23,42,0.12)] backdrop-blur">
            <CardContent className="space-y-6 p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-manrope type-nav uppercase tracking-[0.22em] text-emerald-800">
                    Dealer access
                  </p>
                  <p className="font-manrope type-nav text-slate-700">
                    Know Your Farmer Information
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                  <Smartphone className="h-5 w-5" />
                </div>
              </div>

              <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
                <Link
                  href="/login"
                  className="rounded-xl px-4 py-3 text-center text-sm font-semibold text-slate-500 transition hover:text-slate-800"
                >
                  Login
                </Link>
                <button
                  type="button"
                  className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-emerald-800 shadow-sm"
                >
                  Register
                </button>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="font-manrope type-nav text-slate-800">
                      Shop name
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
                      Owner name
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
                      Mobile number
                    </label>
                    <Input
                      placeholder="Enter mobile number"
                      inputMode="tel"
                      maxLength={10}
                      value={form.mobile}
                      onChange={handleChange("mobile")}
                      required
                    />
                    <p className="font-manrope type-small text-slate-500">
                      Enter a valid 10-digit mobile number.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="font-manrope type-nav text-slate-800">
                      Password (optional)
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
                      District
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
                      State
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
                      Mandal
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
                      Village
                    </label>
                    <Input
                      placeholder="Enter village"
                      value={form.village}
                      onChange={handleChange("village")}
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="font-manrope type-nav text-slate-800">
                      Aadhaar or GST number
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

                {error ? (
                  <p className="font-manrope type-small text-red-600">{error}</p>
                ) : null}

                <Button
                  size="lg"
                  className="w-full sm:w-auto"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Registering..." : "Register dealer"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>

              <p className="font-manrope type-small text-slate-600 lg:hidden">
                Already have a dealer account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Login here
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
