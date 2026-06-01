"use client";

import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAdminLanguage } from "@/components/admin-language-provider";
import { PageHeader } from "@/components/navigation/page-header";
import { BlacklistList } from "@/components/tables/blacklist-list";
import {
  deleteBlacklistEntry,
  fetchBlacklistEntries,
  type AdminBlacklistRecord,
} from "@/lib/api/blacklist";

export default function BlacklistPage() {
  const { t } = useAdminLanguage();
  const [entries, setEntries] = useState<AdminBlacklistRecord[]>([]);

  useEffect(() => {
    void fetchBlacklistEntries()
      .then((response) => setEntries(response.entries))
      .catch(() => setEntries([]));
  }, []);

  const removeEntry = async (recordId: number) => {
    await deleteBlacklistEntry(recordId);
    setEntries((current) => current.filter((entry) => entry.recordId !== recordId));
  };

  return (
    <>
      <PageHeader
        title={t("blacklist.title")}
        description={t("blacklist.description")}
      />
      <Card className="mb-6 overflow-hidden border-red-950 bg-blacklist text-white">
        <div className="grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_16rem] md:items-center">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/10">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold leading-tight">{t("blacklist.bannerTitle")}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-red-100">{t("blacklist.bannerBody")}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-xl font-medium leading-none">2</p>
              <p className="mt-1 text-xs font-normal text-red-100">{t("blacklist.states")}</p>
            </div>
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-xl font-medium leading-none">AP/TS</p>
              <p className="mt-1 text-xs font-normal text-red-100">{t("blacklist.coverage")}</p>
            </div>
          </div>
        </div>
      </Card>
      <BlacklistList records={entries} onRemove={removeEntry} />
    </>
  );
}
