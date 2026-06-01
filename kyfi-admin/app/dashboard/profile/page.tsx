"use client";

import { useEffect, useState } from "react";
import { CircleAlert, Loader2, MapPin, Phone, ShieldCheck, Store, UserRound } from "lucide-react";
import Link from "next/link";
import { useAdminLanguage } from "@/components/admin-language-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/navigation/page-header";
import { fetchAdminProfile, type AdminProfile } from "@/lib/api/profile";

export default function ProfilePage() {
  const { t } = useAdminLanguage();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetchAdminProfile();
        if (!active) {
          return;
        }

        setProfile(response.dealer);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : t("profile.loadError"));
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, [t]);

  const profileName = profile?.name || t("profile.loading");
  const profileSubtitle = profile ? profile.shopName || profile.mobile : t("profile.loading");

  return (
    <>
      <PageHeader
        title={t("profile.title")}
        description={t("profile.description")}
        actions={
          <Button asChild disabled={isLoading || !profile}>
            <Link href="/dashboard/profile/edit">{t("profile.edit")}</Link>
          </Button>
        }
      />

      {error ? (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CircleAlert className="h-4 w-4" />
              <span>{error}</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsLoading(true);
                setError("");
                void fetchAdminProfile()
                  .then((response) => {
                    setProfile(response.dealer);
                  })
                  .catch((retryError) => {
                    setError(retryError instanceof Error ? retryError.message : t("profile.loadError"));
                  })
                  .finally(() => setIsLoading(false));
              }}
            >
              {t("profile.retry")}
            </Button>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <Card>
          <CardContent className="flex min-h-80 items-center justify-center p-6">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t("profile.loading")}</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="overflow-hidden">
            <CardContent className="flex h-full min-h-[26rem] flex-col justify-between p-0">
              <div className="bg-gradient-to-br from-primary/10 via-background to-primary/5 px-6 py-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="rounded-2xl border border-primary/15 bg-background p-4 shadow-sm">
                    <UserRound className="h-10 w-10 text-primary" />
                  </div>
                  <div className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                    {profile?.role === "admin" ? t("profile.role") : profile?.role || t("profile.role")}
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                    {profileName}
                  </h2>
                  <p className="text-sm text-muted-foreground">{profileSubtitle}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("profile.accountTitle")}</CardTitle>
              <CardDescription>{t("profile.accountDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
                <Info icon={<Phone className="h-4 w-4" />} label={t("profile.mobile")} value={profile?.mobile || "-"} />
                <Info icon={<ShieldCheck className="h-4 w-4" />} label={t("profile.role")} value={profile?.role || "-"} />
                <Info
                  icon={<MapPin className="h-4 w-4" />}
                  label={t("profile.region")}
                value={
                  [profile?.state, profile?.district, profile?.mandal, profile?.village]
                    .filter(Boolean)
                    .join(", ") || "-"
                }
              />
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
