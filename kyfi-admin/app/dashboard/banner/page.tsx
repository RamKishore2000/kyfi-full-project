"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Loader2, MonitorSmartphone, Save, Smartphone, Upload } from "lucide-react";
import { useAdminLanguage } from "@/components/admin-language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/navigation/page-header";
import {
  fetchAdminSiteBanner,
  updateAdminSiteBanner,
  type SiteBannerRecord,
} from "@/lib/api/site-banner";

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}

function UploadPreviewCard({
  title,
  hint,
  icon: Icon,
  preview,
  onChange,
  fileName,
  recommendedSize,
}: {
  title: string;
  hint: string;
  icon: typeof MonitorSmartphone;
  preview: string | null;
  onChange: (file: File | null) => void;
  fileName: string | null;
  recommendedSize: string;
}) {
  const { t } = useAdminLanguage();
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <div className="border-b border-slate-200/80 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">{title}</p>
              <p className="text-xs text-slate-500">{hint}</p>
            </div>
          </div>
          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            {t("banner.recommended")} {recommendedSize}
          </span>
        </div>
      </div>

      <label className="group block cursor-pointer p-4">
        <input
          className="sr-only"
          type="file"
          accept="image/*"
          onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        />

        <div className="overflow-hidden rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50 transition group-hover:border-emerald-300 group-hover:bg-emerald-50/40">
          {preview ? (
            <div className="relative aspect-[16/10] w-full bg-background">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt={title} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
                {t("banner.preview")}
              </div>
            </div>
          ) : (
            <div className="flex aspect-[16/10] flex-col items-center justify-center px-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                <Upload className="h-6 w-6 text-emerald-700" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900">{t("banner.upload")}</p>
              <p className="mt-1 max-w-56 text-xs leading-5 text-slate-500">{t("banner.fileTypes")}</p>
            </div>
          )}
        </div>
      </label>

      <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
        <span className="truncate">{fileName || t("banner.noFile")}</span>
        <span>{t("banner.diskUpload")}</span>
      </div>
    </div>
  );
}

export default function HeroBannerAdminPage() {
  const { t } = useAdminLanguage();
  const [desktopPreview, setDesktopPreview] = useState<string | null>(null);
  const [mobilePreview, setMobilePreview] = useState<string | null>(null);
  const [desktopFile, setDesktopFile] = useState<File | null>(null);
  const [mobileFile, setMobileFile] = useState<File | null>(null);
  const [desktopName, setDesktopName] = useState<string | null>(null);
  const [mobileName, setMobileName] = useState<string | null>(null);
  const [currentBanner, setCurrentBanner] = useState<SiteBannerRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let mounted = true;

    fetchAdminSiteBanner()
      .then((response) => {
        if (!mounted) return;

        setCurrentBanner(response.banner);
        setDesktopPreview(response.banner.desktopImageUrl);
        setMobilePreview(response.banner.mobileImageUrl);
      })
      .catch((fetchError) => {
        if (!mounted) return;
        setError(fetchError instanceof Error ? fetchError.message : t("banner.failedLoad"));
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (desktopPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(desktopPreview);
      }
      if (mobilePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(mobilePreview);
      }
    };
  }, [desktopPreview, mobilePreview]);

  const currentImages = useMemo(
    () => [
      {
        label: t("banner.desktop"),
        src: currentBanner?.desktopImageUrl ?? null,
        name: currentBanner?.desktopImageName ?? null,
        icon: MonitorSmartphone,
      },
      {
        label: t("banner.mobile"),
        src: currentBanner?.mobileImageUrl ?? null,
        name: currentBanner?.mobileImageName ?? null,
        icon: Smartphone,
      },
    ],
    [currentBanner, t],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!desktopFile && !mobileFile) {
      setError("Select at least one banner image to update.");
      return;
    }

    setSaving(true);

    try {
      const payload: { desktopImageDataUrl?: string; mobileImageDataUrl?: string } = {};

      if (desktopFile) {
        payload.desktopImageDataUrl = await readFileAsDataUrl(desktopFile);
      }

      if (mobileFile) {
        payload.mobileImageDataUrl = await readFileAsDataUrl(mobileFile);
      }

      const response = await updateAdminSiteBanner(payload);
      setCurrentBanner(response.banner);
      setDesktopPreview(response.banner.desktopImageUrl);
      setMobilePreview(response.banner.mobileImageUrl);
      setDesktopFile(null);
      setMobileFile(null);
      setDesktopName(null);
      setMobileName(null);
      setSuccess(response.message);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t("banner.failedUpdate"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title={t("banner.title")}
        description={t("banner.description")}
      />

      <div className="space-y-6">
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white shadow-[0_24px_70px_rgba(15,23,42,0.32)]">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-3">
                <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/80">
                  {t("banner.title")}
                </div>
                <h2 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                  {t("banner.currentImages")}
                </h2>
                <p className="max-w-2xl text-sm leading-7 text-white/70">
                  {t("banner.imagesDescription")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/80">
                  {loading ? t("common.loading") : t("banner.saved")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-5 lg:grid-cols-2">
                <UploadPreviewCard
                  title={t("banner.desktop")}
                  hint={t("banner.desktopHint")}
                  icon={MonitorSmartphone}
                  preview={desktopPreview}
                  fileName={desktopName}
                  recommendedSize="1600 x 720"
                  onChange={(file) => {
                    if (desktopPreview?.startsWith("blob:")) {
                      URL.revokeObjectURL(desktopPreview);
                    }
                    setDesktopFile(file);
                    setDesktopName(file?.name ?? null);
                    setDesktopPreview(file ? URL.createObjectURL(file) : currentBanner?.desktopImageUrl ?? null);
                  }}
                />

                <UploadPreviewCard
                  title={t("banner.mobile")}
                  hint={t("banner.mobileHint")}
                  icon={Smartphone}
                  preview={mobilePreview}
                  fileName={mobileName}
                  recommendedSize="1080 x 1350"
                  onChange={(file) => {
                    if (mobilePreview?.startsWith("blob:")) {
                      URL.revokeObjectURL(mobilePreview);
                    }
                    setMobileFile(file);
                    setMobileName(file?.name ?? null);
                    setMobilePreview(file ? URL.createObjectURL(file) : currentBanner?.mobileImageUrl ?? null);
                  }}
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {t("banner.currentLine1")} {t("banner.currentLine2")}
              </div>

              {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
              {success ? <p className="text-sm font-medium text-emerald-700">{success}</p> : null}

              <div className="flex justify-end">
                <Button className="min-w-44" type="submit" disabled={saving || loading}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("banner.saving")}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {t("banner.save")}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
