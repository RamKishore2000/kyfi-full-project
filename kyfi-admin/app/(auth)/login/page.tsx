"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Phone } from "lucide-react";
import { useAdminLanguage } from "@/components/admin-language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { loginAdmin } from "@/lib/api/auth";

export default function LoginPage() {
  const { t } = useAdminLanguage();
  const router = useRouter();
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!/^[6-9]\d{9}$/.test(mobile.trim())) {
      setError(t("auth.invalidMobile"));
      return;
    }

    if (password.trim().length < 4) {
      setError(t("auth.invalidPassword"));
      return;
    }

    setIsLoading(true);

    void loginAdmin({ mobile: mobile.trim(), password: password.trim() })
      .then((data) => {
        if (data.dealer?.role !== "admin") {
          throw new Error(t("auth.onlyAdmin"));
        }

        window.localStorage.setItem("kyfi_admin_token", data.token);
        window.localStorage.setItem("kyfi_admin_role", "admin");
        router.push("/dashboard");
      })
      .catch((loginError) => {
        setError(loginError instanceof Error ? loginError.message : t("auth.onlyAdmin"));
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <Card className="w-full max-w-md border-slate-200 shadow-lg">
      <CardHeader className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          {t("auth.adminAccess")}
        </p>
        <CardTitle className="text-2xl">{t("auth.loginTitle")}</CardTitle>
        <CardDescription>{t("auth.loginDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="space-y-2 text-sm font-medium text-foreground">
            {t("auth.mobile")}
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="h-11 pl-9"
                placeholder="9876543210"
                inputMode="tel"
                maxLength={10}
                value={mobile}
                onChange={(event) => {
                  setMobile(event.target.value);
                  setError("");
                }}
              />
            </div>
          </label>

          <label className="space-y-2 text-sm font-medium text-foreground">
            {t("auth.password")}
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="h-11 pl-9 pr-10"
                placeholder={t("auth.password")}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <Button className="w-full" type="submit" disabled={isLoading}>
            {isLoading ? t("auth.signingIn") : t("auth.signIn")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
