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
import { ArrowRight, Eye, EyeOff, Leaf, Lock, Phone } from "lucide-react";
import { motion } from "framer-motion";
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
  const otpDigits = useMemo(() => otp.replace(/\D/g, "").slice(0, 6).split(""), [otp]);

  useEffect(() => {
    setResendLabel(t("login.resendOtp"));
  }, [t]);

  const getDealerStatusMessage = (status?: string) => {
    const normalized = String(status || "").trim().toLowerCase();

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

  const handleOtpKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
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

      if (String(data.dealer?.status || "").toLowerCase() !== "approved") {
        setError(getDealerStatusMessage(data.dealer?.status));
        return;
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem("kyfi_token", data.token);
        window.localStorage.setItem("kyfi_dealer", JSON.stringify(data.dealer));
        window.dispatchEvent(new Event("kyfi-auth-changed"));
      }

      router.push("/dashboard");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : t("login.failed"));
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

      if (String(data.dealer?.status || "").toLowerCase() !== "approved") {
        setError(getDealerStatusMessage(data.dealer?.status));
        return;
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem("kyfi_token", data.token);
        window.localStorage.setItem("kyfi_dealer", JSON.stringify(data.dealer));
        window.dispatchEvent(new Event("kyfi-auth-changed"));
      }

      router.push("/dashboard");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : t("login.failed"));
    } finally {
      setIsOtpLoggingIn(false);
    }
  };

  const errorBanner = error ? (
    <div className="rounded-full border border-red-200 bg-red-50 px-4 py-3">
      <p className="font-manrope text-sm font-semibold leading-6 text-red-700">{error}</p>
    </div>
  ) : null;

  return (
    <main className="min-h-screen bg-[#F8F7F4] px-2 py-2 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
      <section className="grid min-h-[calc(100vh-1rem)] overflow-hidden rounded-[28px] bg-[#F8F7F4] shadow-[0_0_0_1px_rgba(17,24,39,0.04)] lg:min-h-[calc(100vh-3rem)] lg:grid-cols-2 lg:rounded-[34px]">
        <div className="order-2 hidden min-h-[280px] lg:order-1 lg:block lg:h-screen">
          <div className="relative h-full w-full overflow-hidden">
            <img
              src="/loginbanner.png"
              alt="KYFI dealer illustration"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          </div>
        </div>

        <div className="order-1 flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#F8F7F4_0%,#F6F0E7_100%)] px-4 py-2 lg:order-2 lg:px-6">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="w-full max-w-[34rem] lg:ml-auto lg:mr-10 xl:mr-14"
          >
            <div
              className="relative w-full rounded-[32px] px-5 py-5 sm:px-6 sm:py-6"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 18% 12%, rgba(255,255,255,0.66) 0, rgba(255,255,255,0.14) 18%, rgba(255,255,255,0) 42%), radial-gradient(circle at 82% 78%, rgba(212,175,55,0.08) 0, rgba(212,175,55,0.02) 18%, rgba(212,175,55,0) 38%), linear-gradient(180deg, rgba(248,247,244,0.98) 0%, rgba(244,240,232,0.94) 100%)",
              }}
            >
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[rgb(4,120,87)] text-white">
                      <Leaf className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-manrope text-[1.6rem] font-black leading-none tracking-[-0.05em] text-[rgb(4,120,87)]">
                        KYFI
                      </p>
                      <p className="hidden font-manrope text-[0.64rem] font-semibold uppercase tracking-[0.24em] text-slate-500 lg:block">
                        KNOW YOUR FARMER INFORMATION
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 rounded-full border border-[#D9D5C8] bg-[#FAF8F2] px-4 py-2 text-slate-700">
                    <Phone className="h-4 w-4 text-[rgb(4,120,87)]" />
                    <span className="font-manrope text-[0.82rem] font-medium">{t("login.mobilePhone")}</span>
                  </div>
                </div>

                <p className="font-manrope text-[0.96rem] font-medium tracking-[0.02em] text-slate-700">
                  {t("login.dealerAccessCaps")}
                </p>

                <div className="grid grid-cols-2 rounded-full bg-[#EEF0EA] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.78)]">
                  <button
                    type="button"
                    className="rounded-full bg-[rgb(4,120,87)] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-105"
                  >
                    {t("login.loginCard")}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/register")}
                    className="rounded-full px-4 py-3 text-sm font-semibold text-slate-600 transition hover:text-[rgb(4,120,87)]"
                  >
                    {t("login.registerCard")}
                  </button>
                </div>

              {mode === "password" ? (
                <form className="space-y-4" onSubmit={(event) => void (event.preventDefault(), performPasswordLogin())}>
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
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {errorBanner}

                  <Button
                    size="lg"
                    className="h-12 w-full rounded-full !bg-[rgb(4,120,87)] px-5 !text-white transition hover:!bg-[rgb(4,120,87)] hover:brightness-105"
                    type="submit"
                    disabled={isPasswordLoggingIn}
                  >
                    <span className="flex items-center gap-2">
                      {isPasswordLoggingIn ? t("login.loggingIn") : t("login.loginAndGo")}
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode("otp");
                      setStep("mobile");
                      setError("");
                    }}
                    className="mx-auto block font-manrope text-xs font-semibold text-[rgb(4,120,87)] transition hover:text-[rgb(4,120,87)]"
                  >
                    {t("login.loginWithOtp")}
                  </button>
                </form>
              ) : step === "mobile" ? (
                <form className="space-y-4" onSubmit={(event) => {
                  event.preventDefault();
                  setError("");

                  if (!mobilePattern.test(mobile.trim())) {
                    setError(t("login.invalidMobile"));
                    return;
                  }

                  setStep("otp");
                }}>
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
                    <div className="grid grid-cols-6 gap-2 sm:gap-3">
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
                          onChange={(event) => updateOtpDigit(index, event.target.value)}
                          onKeyDown={(event) => handleOtpKeyDown(index, event)}
                          onPaste={index === 0 ? handleOtpPaste : undefined}
                          className="h-14 rounded-2xl border border-slate-200 bg-white text-center font-manrope text-[1.05rem] font-semibold tracking-[0.35em] text-slate-900 outline-none transition focus:border-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-100"
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
                      {isOtpLoggingIn ? t("login.loggingIn") : t("login.loginAndGo")}
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
                    className="mx-auto block font-manrope text-xs font-semibold text-[rgb(4,120,87)] transition hover:text-[rgb(4,120,87)]"
                  >
                    {t("login.loginWithPassword")}
                  </button>
                </div>
              )}
            </div>
          </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
