"use client";

import { useState } from "react";
import { ArrowRight, Eye, EyeOff, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/kyfi/auth-guard";
import { Footer } from "@/components/kyfi/footer";
import { Header } from "@/components/kyfi/header";
import { KyfiToast } from "@/components/kyfi/kyfi-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateDealerPassword } from "@/lib/api/profile";
import { useKyfiLanguage } from "@/components/kyfi/language-provider";

export default function ChangePasswordPage() {
  const { t } = useKyfiLanguage();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    tone: "success" | "error";
  }>({
    open: false,
    message: "",
    tone: "success",
  });

  const showToast = (nextMessage: string, tone: "success" | "error" = "success") => {
    setToast({ open: true, message: nextMessage, tone });
  };

  const handleSubmit = async () => {
    setError("");

    if (newPassword.trim().length < 4) {
      setError("New password must be at least 4 characters.");
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setError("New password and confirm password must match.");
      return;
    }

    setLoading(true);

    try {
      const response = await updateDealerPassword({
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      });

      const successMessage = response.message || "Password updated successfully";
      showToast(successMessage);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (submitError) {
      const nextError =
        submitError instanceof Error ? submitError.message : "Unable to update password";
      setError(nextError);
      showToast(nextError, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <main className="kyfi-shell min-h-screen">
        <Header />

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-3xl">
            <p className="font-manrope type-small uppercase tracking-[0.2em] text-emerald-700">
              Settings
            </p>
            <h1 className="mt-3 font-manrope type-section text-slate-900">
              {t("settings.changePassword")}
            </h1>
            <p className="mt-4 font-manrope type-body text-slate-600">
              Update your dealer password from a dedicated page.
            </p>
          </div>

          <div className="w-full rounded-3xl border border-white/80 bg-white/85 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[0.72rem] font-extrabold uppercase tracking-[0.2em] text-emerald-700">
                  <KeyRound className="h-3.5 w-3.5" />
                  {t("settings.changePassword")}
                </div>
                <h2 className="mt-3 font-manrope text-[1.65rem] font-extrabold tracking-[-0.04em] text-slate-900">
                  {t("settings.passwordHeader")}
                </h2>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="rounded-full"
              >
                Back
              </Button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <label className="font-manrope type-nav text-slate-800">
                  {t("settings.currentPassword")}
                </label>
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    className="pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((current) => !current)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                    aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-manrope type-nav text-slate-800">
                  {t("settings.newPassword")}
                </label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((current) => !current)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-manrope type-nav text-slate-800">
                  {t("settings.confirmPassword")}
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={loading}
                  className="w-full !bg-[rgb(4,120,87)] !text-white hover:!bg-[rgb(4,120,87)] hover:brightness-105 sm:w-auto sm:min-w-[280px] lg:min-w-[320px]"
                >
                  <span>{loading ? t("settings.updating") : t("settings.submitPassword")}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              {error ? <p className="font-manrope text-sm text-red-600">{error}</p> : null}
            </div>
          </div>
        </section>

        <KyfiToast
          open={toast.open}
          message={toast.message}
          tone={toast.tone}
          onClose={() => setToast((current) => ({ ...current, open: false }))}
        />

        <Footer />
      </main>
    </AuthGuard>
  );
}
