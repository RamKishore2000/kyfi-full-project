"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { ArrowRight, Eye, EyeOff, Lock, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { Capacitor } from "@capacitor/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getKyfiDictionary } from "@/lib/kyfi-i18n";
import { loginDealerOtp, loginDealerPassword } from "@/lib/api/auth";

export default function LoginPage() {
  const router = useRouter();
  const english = getKyfiDictionary("en");
  const t = (key: string) => english[key] ?? key;
  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [mode, setMode] = useState<"password" | "otp">("password");
  const [resendLabel, setResendLabel] = useState(t("login.resendOtp"));
  const [isPasswordLoggingIn, setIsPasswordLoggingIn] = useState(false);
  const [isOtpLoggingIn, setIsOtpLoggingIn] = useState(false);
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const mobilePattern = /^[6-9]\d{9}$/;
  const otpPattern = /^\d{6}$/;
  const otpDigits = useMemo(
    () => otp.replace(/\D/g, "").slice(0, 6).split(""),
    [otp],
  );

  useEffect(() => {
    setResendLabel(t("login.resendOtp"));
  }, [t]);

  const getDealerStatusMessage = (status?: string) => {
    const normalized = String(status || "")
      .trim()
      .toLowerCase();

    if (normalized === "pending") {
      return t("login.pending");
    }

    if (normalized === "rejected") {
      return t("login.rejected");
    }

    if (normalized === "suspended") {
      return t("login.suspended");
    }

    return t("login.notApproved");
  };

  const routeAfterLogin = (
    dealer?: {
      status?: string;
      subscriptionStatus?: string;
      id?: number;
      mobile?: string;
      name?: string;
    },
    token?: string,
  ) => {
    const subscriptionStatus = String(dealer?.subscriptionStatus || "")
      .trim()
      .toLowerCase();

    if (subscriptionStatus !== "active") {
      if (typeof window !== "undefined" && dealer) {
        window.localStorage.setItem("kyfi_pending_dealer", JSON.stringify(dealer));
        window.localStorage.removeItem("kyfi_dealer");
      }
      router.push("/register?step=subscription");
      return;
    }

    const status = String(dealer?.status || "").trim().toLowerCase();
    if (status === "pending") {
      setError(getDealerStatusMessage(dealer?.status));
      return;
    }

    if (status !== "approved") {
      setError(getDealerStatusMessage(dealer?.status));
      return;
    }

    if (typeof window !== "undefined" && dealer && token) {
      window.localStorage.setItem("kyfi_token", token);
      window.localStorage.setItem("kyfi_dealer", JSON.stringify(dealer));
      window.localStorage.removeItem("kyfi_pending_dealer");
      window.dispatchEvent(new Event("kyfi-auth-changed"));
    }

    router.push(Capacitor.isNativePlatform() ? "/dashboard" : "/");
  };

  const handleResendOtp = () => {
    setResendLabel(t("login.sentAgain"));
    window.setTimeout(() => setResendLabel(t("login.resendOtp")), 3000);
  };

  const handleMobileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setMobile(event.target.value);
    setError("");
  };

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
    setError("");
  };

  const updateOtpDigit = (index: number, value: string) => {
    const digits = otpDigits.slice();
    const nextValue = value.replace(/\D/g, "").slice(-1);
    digits[index] = nextValue;
    const nextOtp = digits.join("").padEnd(6, "");
    setOtp(nextOtp);
    setError("");

    if (nextValue && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;

    setOtp(pasted);
    setError("");

    const focusIndex = Math.min(pasted.length, 5);
    window.setTimeout(() => otpInputRefs.current[focusIndex]?.focus(), 0);
  };

  const performPasswordLogin = async () => {
    setError("");

    if (!mobilePattern.test(mobile.trim())) {
      setError(t("login.invalidMobile"));
      return;
    }

    if (password.trim().length < 4) {
      setError(t("login.invalidPassword"));
      return;
    }

    setIsPasswordLoggingIn(true);

    try {
      const data = await loginDealerPassword({
        mobile: mobile.trim(),
        password: password.trim(),
      });

      if (data.dealer?.role !== "dealer") {
        setError(t("login.onlyDealer"));
        return;
      }

      routeAfterLogin(data.dealer, data.token);
    } catch (loginError) {
      setError(
        loginError instanceof Error ? loginError.message : t("login.failed"),
      );
    } finally {
      setIsPasswordLoggingIn(false);
    }
  };

  const performOtpLogin = async () => {
    setError("");

    if (!mobilePattern.test(mobile.trim())) {
      setError(t("login.invalidMobile"));
      return;
    }

    if (!otpPattern.test(otp.trim())) {
      setError(t("login.invalidOtp"));
      return;
    }

    setIsOtpLoggingIn(true);

    try {
      const data = await loginDealerOtp({
        mobile: mobile.trim(),
        otp: otp.trim(),
      });

      if (data.dealer?.role !== "dealer") {
        setError(t("login.onlyDealer"));
        return;
      }

      routeAfterLogin(data.dealer, data.token);
    } catch (loginError) {
      setError(
        loginError instanceof Error ? loginError.message : t("login.failed"),
      );
    } finally {
      setIsOtpLoggingIn(false);
    }
  };

  const errorBanner = error ? (
    <div className="rounded-full border border-red-200 bg-red-50 px-4 py-3">
      <p className="font-manrope text-sm font-semibold leading-6 text-red-700">
        {error}
      </p>
    </div>
  ) : null;

  return (
    <main className="kyfi-auth-page flex min-h-[100dvh] items-center justify-center bg-[#F8F7F4] px-0 py-0 sm:px-4 sm:py-4 lg:min-h-screen lg:px-6 lg:py-6">
      <section className="grid min-h-[100dvh] w-full overflow-hidden bg-[#F8F7F4] lg:min-h-[calc(100vh-3rem)] lg:grid-cols-2 lg:rounded-[34px] lg:shadow-[0_0_0_1px_rgba(17,24,39,0.04)]">
        <div className="order-2 hidden min-h-[280px] lg:order-1 lg:block lg:min-h-[calc(100vh-3rem)]">
          <div className="relative h-full w-full overflow-hidden">
            <img
              src="/loginbanner.png"
              alt="KYFI dealer illustration"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          </div>
        </div>

        <div className="order-1 flex min-h-[100dvh] items-center justify-center overflow-y-auto bg-[linear-gradient(180deg,#F8F7F4_0%,#F3EEE4_100%)] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] lg:order-2 lg:min-h-[calc(100vh-3rem)] lg:items-center lg:justify-center lg:overflow-hidden lg:bg-[linear-gradient(180deg,#F8F7F4_0%,#F6F0E7_100%)] lg:px-6 lg:py-4">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="my-auto w-full max-w-[29rem] py-2 lg:ml-auto lg:mr-10 lg:max-w-[34rem] lg:py-0 xl:mr-14"
          >
            <div className="mb-6 flex flex-col items-center justify-center text-center lg:hidden">
              <img
                src="/kyfi-logo.png"
                alt="KYFI"
                className="h-16 w-auto object-contain"
              />
            </div>

            <div className="no-scrollbar w-full max-w-[34rem] lg:mx-auto lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:px-2">
              <div
                className="relative w-full rounded-none border-0 bg-transparent px-0 py-0 shadow-none sm:px-0 sm:py-0 lg:rounded-[32px] lg:border-0 lg:bg-[linear-gradient(180deg,rgba(248,247,244,0.98)_0%,rgba(244,240,232,0.94)_100%)] lg:px-5 lg:py-4 lg:shadow-none"
              >
                <div className="space-y-5 lg:space-y-4">
                <div className="hidden items-start justify-between gap-4 lg:flex">
                  <div className="flex items-center gap-3">
                    <img
                      src="/kyfi-logo.png"
                      alt="KYFI"
                      className="h-14 w-auto object-contain"
                    />
                  </div>

                </div>

                <div className="text-center lg:hidden">
                  <h1 className="font-manrope text-[2rem] font-black leading-[1.05] tracking-[-0.055em] text-slate-950">
                    Welcome back
                  </h1>
                  <p className="mt-2 font-manrope text-[0.86rem] font-semibold uppercase tracking-[0.18em] text-[rgb(4,120,87)]">
                    Dealer access
                  </p>
                </div>

                <p className="hidden font-manrope text-[1.05rem] font-semibold tracking-[-0.01em] text-slate-800 lg:block lg:text-[0.96rem] lg:font-medium lg:tracking-[0.02em] lg:text-slate-700">
                  {t("login.dealerAccessCaps")}
                </p>

                <div className="grid grid-cols-2 rounded-full bg-[#EBEEE8] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                  <button
                    type="button"
                    className="rounded-full bg-[rgb(4,120,87)] px-4 py-3 text-sm font-bold text-white transition hover:brightness-105 lg:font-semibold"
                  >
                    {t("login.loginCard")}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/register")}
                    className="rounded-full px-4 py-3 text-sm font-bold text-slate-600 transition hover:text-[rgb(4,120,87)] lg:font-semibold"
                  >
                    {t("login.registerCard")}
                  </button>
                </div>

                {mode === "password" ? (
                  <form
                    className="space-y-4"
                    onSubmit={(event) =>
                      void (event.preventDefault(), performPasswordLogin())
                    }
                  >
                    <div className="space-y-2">
                      <label className="font-manrope text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                        {t("login.mobile")}
                      </label>
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          value={mobile}
                          onChange={handleMobileChange}
                          placeholder={t("login.mobilePlaceholder")}
                          inputMode="tel"
                          maxLength={10}
                          className="h-12 rounded-full border border-slate-200 bg-[#F3F4F6] pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="font-manrope text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                        {t("login.password")}
                      </label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={handlePasswordChange}
                          placeholder={t("login.passwordPlaceholder")}
                          className="h-12 rounded-full border border-slate-200 bg-[#F3F4F6] pl-11 pr-11 text-slate-900 placeholder:text-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {errorBanner}

                    <div className="pt-2 lg:pt-0">
                      <Button
                        size="lg"
                        className="h-12 w-full rounded-full !bg-[rgb(4,120,87)] px-5 !text-white transition hover:!bg-[rgb(4,120,87)] hover:brightness-105"
                        type="submit"
                        disabled={isPasswordLoggingIn}
                      >
                        <span className="flex items-center gap-2">
                          {isPasswordLoggingIn
                            ? t("login.loggingIn")
                            : t("login.loginAndGo")}
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </Button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setMode("otp");
                        setStep("mobile");
                        setError("");
                      }}
                      className="mx-auto block font-manrope text-sm font-bold text-[rgb(4,120,87)] transition hover:text-[rgb(4,120,87)] lg:text-xs lg:font-semibold"
                    >
                      {t("login.loginWithOtp")}
                    </button>
                  </form>
                ) : step === "mobile" ? (
                  <form
                    className="space-y-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      setError("");

                      if (!mobilePattern.test(mobile.trim())) {
                        setError(t("login.invalidMobile"));
                        return;
                      }

                      setStep("otp");
                    }}
                  >
                    <div className="space-y-2">
                      <label className="font-manrope text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                        {t("login.mobile")}
                      </label>
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          value={mobile}
                          onChange={handleMobileChange}
                          placeholder={t("login.mobilePlaceholder")}
                          inputMode="tel"
                          maxLength={10}
                          className="h-12 rounded-full border border-slate-200 bg-[#F3F4F6] pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                          required
                        />
                      </div>
                    </div>

                    {errorBanner}

                    <Button
                      size="lg"
                      className="h-12 w-full rounded-full !bg-[rgb(4,120,87)] px-5 !text-white"
                      type="submit"
                    >
                      <span className="flex items-center gap-2">
                        {t("login.continue")}
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3">
                      <p className="font-manrope text-[0.78rem] text-[rgb(4,120,87)]">
                        {t("login.otpSent")} {mobile || "your mobile number"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="font-manrope text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                        {t("login.otp")}
                      </label>
                      <div className="grid grid-cols-6 gap-3 sm:gap-4">
                        {Array.from({ length: 6 }).map((_, index) => (
                          <input
                            key={index}
                            ref={(node) => {
                              otpInputRefs.current[index] = node;
                            }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={otpDigits[index] || ""}
                            onChange={(event) =>
                              updateOtpDigit(index, event.target.value)
                            }
                            onKeyDown={(event) =>
                              handleOtpKeyDown(index, event)
                            }
                            onPaste={index === 0 ? handleOtpPaste : undefined}
                            className="h-12 w-full rounded-none border-0 border-b-2 border-slate-300 bg-transparent px-0 text-center font-manrope text-[1.35rem] font-bold leading-none text-slate-900 outline-none transition focus:border-[rgb(4,120,87)] focus:ring-0"
                            aria-label={`OTP digit ${index + 1}`}
                          />
                        ))}
                      </div>
                      <p className="font-manrope text-[0.78rem] text-slate-500">
                        {t("login.otpHint")}
                      </p>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          className="font-manrope text-sm font-semibold text-[rgb(4,120,87)] transition hover:text-[rgb(4,120,87)] hover:underline"
                        >
                          {resendLabel}
                        </button>
                      </div>
                    </div>

                    {errorBanner}

                    <div className="space-y-3">
                      <Button
                        size="lg"
                        className="h-12 w-full rounded-full !bg-[rgb(4,120,87)] px-5 !text-white transition hover:!bg-[rgb(4,120,87)] hover:brightness-105"
                        onClick={() => void performOtpLogin()}
                        disabled={isOtpLoggingIn}
                      >
                        {isOtpLoggingIn
                          ? t("login.loggingIn")
                          : t("login.loginAndGo")}
                      </Button>
                    </div>

                    <div className="flex justify-start">
                      <button
                        type="button"
                        onClick={() => {
                          setStep("mobile");
                          setError("");
                        }}
                        className="font-manrope text-sm font-semibold text-slate-600 transition hover:text-[rgb(4,120,87)] hover:underline"
                      >
                        {t("login.changeMobile")}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setMode("password");
                        setStep("mobile");
                        setError("");
                      }}
                      className="mx-auto block font-manrope text-sm font-bold text-[rgb(4,120,87)] transition hover:text-[rgb(4,120,87)] lg:text-xs lg:font-semibold"
                    >
                      {t("login.loginWithPassword")}
                    </button>
                  </div>
                )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
