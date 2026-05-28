"use client";

import { useState } from "react";
import { Footer } from "@/components/kyfi/footer";
import { Header } from "@/components/kyfi/header";
import { ChangePasswordModal } from "@/components/kyfi/change-password-modal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function SettingsPage() {
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  return (
    <main className="min-h-screen bg-slate-50">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="font-manrope type-small uppercase tracking-[0.2em] text-emerald-700">
            Settings
          </p>
          <h1 className="mt-3 font-manrope type-section text-slate-900">
            Dealer settings and privacy
          </h1>
          <p className="mt-4 font-manrope type-body text-slate-600">
            These settings reflect the document rules for registered and approved dealers.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-white">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-manrope type-nav text-slate-900">Language</p>
                  <h2 className="mt-1 font-manrope type-card text-slate-900">
                    English default, Telugu supported
                  </h2>
                </div>
                <Badge variant="secondary">Display</Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="font-manrope type-nav text-emerald-800">English</p>
                  <p className="mt-1 font-manrope type-small text-slate-600">
                    Default language
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="font-manrope type-nav text-slate-800">Telugu</p>
                  <p className="mt-1 font-manrope type-small text-slate-600">
                    Supported language
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="space-y-4 p-6">
              <div>
                <p className="font-manrope type-nav text-slate-900">Change Password</p>
                <h2 className="mt-1 font-manrope type-card text-slate-900">
                  Update your dealer password
                </h2>
              </div>
              <p className="font-manrope type-body text-slate-600">
                Use this option to update your password after dealer approval.
              </p>
              <button
                type="button"
                onClick={() => setChangePasswordOpen(true)}
                className="inline-flex rounded-2xl bg-primary px-4 py-3 font-manrope type-nav font-semibold text-white transition hover:bg-primary/90"
                style={{ color: "#ffffff" }}
              >
                Update Password
              </button>
            </CardContent>
          </Card>
        </div>
      </section>

      <ChangePasswordModal
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />

      <Footer />
    </main>
  );
}
