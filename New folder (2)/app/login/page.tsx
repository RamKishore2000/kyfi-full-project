"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { ArrowRight, Smartphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  loginDealerOtp,
  loginDealerPassword,
} from "@/lib/api/auth";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [mode, setMode] = useState<"password" | "otp">("password");
  const [resendLabel, setResendLabel] = useState("Resend OTP");
  const [isPasswordLoggingIn, setIsPasswordLoggingIn] = useState(false);
  const [isOtpLoggingIn, setIsOtpLoggingIn] = useState(false);
  const [mobile, setMobile] = useState("9876543210");
  const [password, setPassword] = useState("dealer@123");
  const [otp, setOtp] = useState("123456");
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

      if (typeof window !== "undefined") {
        window.localStorage.setItem("kyfi_token", data.token);
        window.localStorage.setItem("kyfi_dealer", JSON.stringify(data.dealer));
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

    setError("");
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

      if (typeof window !== "undefined") {
        window.localStorage.setItem("kyfi_token", data.token);
        window.localStorage.setItem("kyfi_dealer", JSON.stringify(data.dealer));
      }

      router.push("/dashboard");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Login failed");
    } finally {
      setIsOtpLoggingIn(false);
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
                <button
                  type="button"
                  className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-emerald-800 shadow-sm"
                >
                  Login
                </button>
                <Link
                  href="/register"
                  className="rounded-xl px-4 py-3 text-center text-sm font-semibold text-slate-500 transition hover:text-slate-800"
                >
                  Register
                </Link>
              </div>

              <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode("password");
                    setStep("mobile");
                  }}
                  className={`rounded-xl px-4 py-3 text-sm font-semibold shadow-sm transition ${
                    mode === "password"
                      ? "bg-white text-emerald-800"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Password Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("otp");
                    setStep("mobile");
                  }}
                  className={`rounded-xl px-4 py-3 text-sm font-semibold shadow-sm transition ${
                    mode === "otp"
                      ? "bg-white text-emerald-800"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  OTP Login
                </button>
              </div>

              {mode === "password" ? (
                <form className="space-y-4" onSubmit={handlePasswordLogin}>
                  <div className="space-y-2">
                    <label className="font-manrope type-nav text-slate-800">
                      Mobile number
                    </label>
                    <Input
                      value={mobile}
                      onChange={handleMobileChange}
                      placeholder="Enter mobile number"
                      inputMode="tel"
                      maxLength={10}
                      className="h-12"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="font-manrope type-nav text-slate-800">
                      Password
                    </label>
                    <Input
                      type="password"
                      value={password}
                      onChange={handlePasswordChange}
                      placeholder="Enter password"
                      className="h-12"
                      required
                    />
                  </div>

                  {error ? (
                    <p className="font-manrope type-small text-red-600">{error}</p>
                  ) : null}

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
                </form>
              ) : step === "mobile" ? (
                <form className="space-y-4" onSubmit={handleContinue}>
                  <div className="space-y-2">
                    <label className="font-manrope type-nav text-slate-800">
                      Mobile number
                    </label>
                    <Input
                      value={mobile}
                      onChange={handleMobileChange}
                      placeholder="Enter mobile number"
                      inputMode="tel"
                      maxLength={10}
                      className="h-12"
                      required
                    />
                  </div>

                  {error ? (
                    <p className="font-manrope type-small text-red-600">{error}</p>
                  ) : null}

                  <Button size="lg" className="w-full" type="submit">
                    Continue
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
                    <label className="font-manrope type-nav text-slate-800">
                      OTP
                    </label>
                    <Input
                      value={otp}
                      onChange={handleOtpChange}
                      placeholder="Enter OTP"
                      inputMode="numeric"
                      maxLength={6}
                      className="h-12 tracking-[0.35em]"
                      required
                    />
                  </div>

                  {error ? (
                    <p className="font-manrope type-small text-red-600">{error}</p>
                  ) : null}

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
                </div>
              )}

              <p className="font-manrope type-small text-slate-600 lg:hidden">
                Want to create a dealer account?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Register here
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
