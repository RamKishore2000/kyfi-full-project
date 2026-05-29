"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LockKeyhole, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { loginAdmin } from "@/lib/api/auth";

export default function LoginPage() {
  const router = useRouter();
  const [mobile, setMobile] = useState("9876543210");
  const [password, setPassword] = useState("admin1234");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!/^[6-9]\d{9}$/.test(mobile.trim())) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    if (password.trim().length < 4) {
      setError("Enter a valid password.");
      return;
    }

    setIsLoading(true);

    void loginAdmin({ mobile: mobile.trim(), password: password.trim() })
      .then((data) => {
        if (data.dealer?.role !== "admin") {
          throw new Error("Only admins can sign in here.");
        }

        window.localStorage.setItem("kyfi_admin_token", data.token);
        window.localStorage.setItem("kyfi_admin_role", "admin");
        router.push("/dashboard");
      })
      .catch((loginError) => {
        setError(loginError instanceof Error ? loginError.message : "Login failed");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <Card className="w-full max-w-md border-slate-200 shadow-lg">
      <CardHeader className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          Admin access
        </p>
        <CardTitle className="text-2xl">Admin login</CardTitle>
        <CardDescription>Use mobile number and password to enter the admin dashboard.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="space-y-2 text-sm font-medium text-foreground">
            Mobile number
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
            Password
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="h-11 pl-9"
                placeholder="Enter password"
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
              />
            </div>
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <Button className="w-full" type="submit" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Role fixed to <span className="font-semibold text-foreground">admin</span>
        </p>

        <div className="flex justify-center">
          <Link className="text-sm font-medium text-primary hover:underline" href="/forgot-password">
            Forgot password?
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
