"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { ArrowRight, Smartphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { loginDealerOtp, loginDealerPassword } from "@/lib/api/auth";
import { useKyfiLanguage } from "@/components/kyfi/language-provider";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useKyfiLanguage();
  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [mode, setMode] = useState<"password" | "otp">("password");
  const [resendLabel, setResendLabel] = useState("Resend OTP");
  const [isPasswordLoggingIn, setIsPasswordLoggingIn] = useState(false);
  const [isOtpLoggingIn, setIsOtpLoggingIn] = useState(false);
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const mobilePattern = /^[6-9]\d{9}$/;
  const otpPattern = /^\d{6}$/;

  const handleResendOtp = () => {
    setResendLabel("OTP sent again");
    window.setTimeout(() => setResendLabel("Resend OTP"), 3000);
  };

  const handleMobileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setMobile(event.target.value);
    setError("");
  };

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
    setError("");
  };

  const handleOtpChange = (event: ChangeEvent<HTMLInputElement>) => {
    setOtp(event.target.value);
    setError("");
  };

  const performPasswordLogin = async () => {
    setError("");

    if (!mobilePattern.test(mobile.trim())) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    if (password.trim().length < 4) {
      setError("Enter a valid password with at least 4 characters.");
      return;
    }

    setIsPasswordLoggingIn(true);

    try {
      const data = await loginDealerPassword({
        mobile: mobile.trim(),
        password: password.trim(),
      });

      if (data.dealer?.role !== "dealer") {
        setError("Only dealers can sign in here.");
        return;
      }

      if (data.dealer?.status !== "approved") {
        setError("Dealer account is pending approval.");
        return;
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem("kyfi_token", data.token);
        window.localStorage.setItem("kyfi_dealer", JSON.stringify(data.dealer));
        window.localStorage.setItem("kyfi_language", data.dealer?.languagePreference || "en");
      }

      router.push("/dashboard");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Login failed");
    } finally {
      setIsPasswordLoggingIn(false);
    }
  };

  const handlePasswordLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await performPasswordLogin();
  };

  const handleContinue = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!mobilePattern.test(mobile.trim())) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    setStep("otp");
  };

  const performOtpLogin = async () => {
    setError("");

    if (!mobilePattern.test(mobile.trim())) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    if (!otpPattern.test(otp.trim())) {
      setError("Enter a valid 6-digit OTP.");
      return;
    }

    setIsOtpLoggingIn(true);

    try {
      const data = await loginDealerOtp({
        mobile: mobile.trim(),
        otp: otp.trim(),
      });

      if (data.dealer?.role !== "dealer") {
        setError("Only dealers can sign in here.");
        return;
      }

      if (data.dealer?.status !== "approved") {
        setError("Dealer account is pending approval.");
        return;
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem("kyfi_token", data.token);
        window.localStorage.setItem("kyfi_dealer", JSON.stringify(data.dealer));
        window.localStorage.setItem("kyfi_language", data.dealer?.languagePreference || "en");
      }

      router.push("/dashboard");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Login failed");
    } finally {
      setIsOtpLoggingIn(false);
    }
  };

  const renderCard = (): ReactNode => (
    <Card className="w-full border-white/85 bg-white/95 shadow-[0_28px_100px_rgba(15,23,42,0.22)] backdrop-blur-xl">
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
              {t("login.dealerAccess")}
            </p>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
            <Smartphone className="h-5 w-5" />
          </div>
        </div>

        <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
          <button
            type="button"
            className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 shadow-sm"
          >
            {t("login.login")}
          </button>
          <Link
            href="/register"
            className="rounded-xl px-4 py-2.5 text-center text-sm font-semibold text-slate-500 transition hover:text-slate-800"
          >
            {t("login.register")}
          </Link>
        </div>

        {mode === "password" ? (
          <form className="space-y-4" onSubmit={handlePasswordLogin}>
            <div className="space-y-2">
              <label className="font-manrope type-nav text-slate-800">{t("login.mobile")}</label>
              <Input
                value={mobile}
                onChange={handleMobileChange}
                placeholder="Enter mobile number"
                inputMode="tel"
                maxLength={10}
                className="h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="font-manrope type-nav text-slate-800">{t("login.password")}</label>
              <Input
                type="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter password"
                className="h-11"
                required
              />
            </div>

            {error ? <p className="font-manrope type-small text-red-600">{error}</p> : null}

            <Button
              size="lg"
              className="w-full"
              type="submit"
              onClick={() => void performPasswordLogin()}
              disabled={isPasswordLoggingIn}
            >
              {isPasswordLoggingIn ? "Logging in..." : "Login and go to dashboard"}
              <ArrowRight className="h-4 w-4" />
            </Button>

            <button
              type="button"
              onClick={() => {
                setMode("otp");
                setStep("mobile");
                setError("");
              }}
              className="mx-auto block font-manrope text-xs font-semibold text-emerald-700 transition hover:text-emerald-800"
            >
              Login with OTP
            </button>
          </form>
        ) : step === "mobile" ? (
          <form className="space-y-4" onSubmit={handleContinue}>
            <div className="space-y-2">
              <label className="font-manrope type-nav text-slate-800">{t("login.mobile")}</label>
              <Input
                value={mobile}
                onChange={handleMobileChange}
                placeholder="Enter mobile number"
                inputMode="tel"
                maxLength={10}
                className="h-11"
                required
              />
            </div>

            {error ? <p className="font-manrope type-small text-red-600">{error}</p> : null}

            <Button size="lg" className="w-full" type="submit">
              {t("login.continue")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
              <p className="font-manrope type-small text-emerald-800">
                OTP sent to {mobile || "your mobile number"}
              </p>
            </div>

            <div className="space-y-2">
              <label className="font-manrope type-nav text-slate-800">{t("login.otp")}</label>
              <Input
                value={otp}
                onChange={handleOtpChange}
                placeholder="Enter OTP"
                inputMode="numeric"
                maxLength={6}
                className="h-11 tracking-[0.35em]"
                required
              />
            </div>

            {error ? <p className="font-manrope type-small text-red-600">{error}</p> : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
              size="lg"
              className="w-full sm:flex-1"
                onClick={() => void performOtpLogin()}
                disabled={isOtpLoggingIn}
              >
                {isOtpLoggingIn ? "Logging in..." : "Login and go to dashboard"}
              </Button>
              <Button
                variant="outline"
              size="lg"
              className="w-full sm:w-auto"
                onClick={handleResendOtp}
              >
                {resendLabel}
              </Button>
            </div>

            <Button
              variant="ghost"
              size="lg"
              className="w-full"
              onClick={() => {
                setStep("mobile");
                setError("");
              }}
            >
              Change mobile
            </Button>

            <button
              type="button"
              onClick={() => {
                setMode("password");
                setStep("mobile");
                setError("");
              }}
              className="mx-auto block font-manrope text-xs font-semibold text-emerald-700 transition hover:text-emerald-800"
            >
              Login with password
            </button>
          </div>
        )}

      </CardContent>
    </Card>
  );

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(22,101,52,0.12),_transparent_26%),linear-gradient(180deg,#f8fafc_0%,#eef7ef_100%)] px-0 py-0">
      <section className="flex min-h-screen w-full items-stretch">
        <div className="hidden lg:block lg:w-1/2 self-stretch">
          <img
            src="/loginbanner.png"
            alt="KYFI dealer illustration"
            className="h-full w-full object-cover object-center"
          />
        </div>

        <div className="flex w-full items-center justify-center bg-white px-4 py-6 lg:w-1/2 lg:px-8">
          <div className="w-full max-w-[31rem]">{renderCard()}</div>
        </div>
      </section>
    </main>
  );
}
