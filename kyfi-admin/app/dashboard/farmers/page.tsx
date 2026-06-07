"use client";

import { useEffect, useState } from "react";
import { useAdminLanguage } from "@/components/admin-language-provider";
import { PageHeader } from "@/components/navigation/page-header";
import { FarmerTable } from "@/components/tables/farmer-table";
import { Card, CardContent } from "@/components/ui/card";
import { fetchFarmers } from "@/lib/api/farmers";
import type { Farmer } from "@/types";

type FarmerTab = "OLD" | "NEW";

export default function FarmersPage() {
  const { t } = useAdminLanguage();
  const [farmers, setFarmers] = useState<Farmer[] | null>(null);
  const [activeTab, setActiveTab] = useState<FarmerTab>("OLD");
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    setFarmers(null);
    void fetchFarmers(activeTab)
      .then((response) => setFarmers(response.farmers))
      .catch((farmersError) => {
        setError(
          farmersError instanceof Error
            ? farmersError.message
            : t("farmers.loading"),
        );
      });
  }, [activeTab, t]);

  return (
    <>
      <PageHeader
        title={t("farmers.title")}
        description={t("farmers.description")}
      />

      {error ? (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">
            {error}
          </CardContent>
        </Card>
      ) : null}

      <div className="mb-6 grid gap-3 rounded-3xl border bg-card p-2 shadow-sm md:grid-cols-2">
        {(["OLD", "NEW"] as FarmerTab[]).map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={[
                "rounded-2xl border px-5 py-4 text-left transition",
                active
                  ? "border-emerald-200 bg-emerald-50 text-emerald-950 shadow-sm"
                  : "border-transparent bg-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">
                    {tab === "OLD" ? "Old Farmers" : "New Farmers"}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {tab === "OLD"
                      ? "Vote count records checked by mobile number."
                      : "Dealer status records grouped by Aadhaar number."}
                  </p>
                </div>
                {active ? (
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
                    {farmers?.length ?? 0}
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      <FarmerTable farmerRecords={farmers ?? []} farmerType={activeTab} />
    </>
  );
}
