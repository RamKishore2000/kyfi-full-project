"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { useAdminLanguage } from "@/components/admin-language-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ActivityAreaChart } from "@/components/charts/activity-area-chart";
import { StatusPieChart } from "@/components/charts/status-pie-chart";
import { MetricCard } from "@/components/cards/metric-card";
import { PageHeader } from "@/components/navigation/page-header";
import { FarmerTable } from "@/components/tables/farmer-table";
import {
  fetchAdminDashboard,
  type DashboardSummaryResponse,
} from "@/lib/api/dashboard";

export default function DashboardPage() {
  const { t, translateText } = useAdminLanguage();
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
  const [error, setError] = useState("");
  const toTitleCase = (value: string) => {
    if (!value) return value;
    return value
      .split(/(\s+|\+|\/)/)
      .map((part) => {
        if (!part || /^\s+$/.test(part) || part === "+" || part === "/") {
          return part;
        }
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      })
      .join("");
  };
  const metricTitleMap: Record<string, string> = {
    "Total Farmers": "dashboard.metric.totalFarmers",
    "Registered Dealers": "dashboard.metric.registeredDealers",
    "Status Votes": "dashboard.metric.statusVotes",
  };

  useEffect(() => {
    void fetchAdminDashboard()
      .then(setData)
      .catch((dashboardError) => {
        setError(
          dashboardError instanceof Error
            ? dashboardError.message
            : "Unable to load dashboard",
        );
      });
  }, []);

  return (
    <div>
      <PageHeader
        title={t("dashboard.title")}
        description={t("dashboard.description")}
        actions={
          <Button variant="outline">
            <Download className="h-4 w-4" />
            {t("dashboard.export")}
          </Button>
        }
      />

      {error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">
            {error}
          </CardContent>
        </Card>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(data?.analytics ?? [])
          .filter((item) => item.label !== "Blacklist Entries")
          .map((item) => (
            <MetricCard
              key={item.label}
              {...item}
              label={toTitleCase(t(metricTitleMap[item.label] ?? item.label))}
              change={toTitleCase(translateText(item.change))}
            />
          ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.monthlyTitle")}</CardTitle>
            <CardDescription>
              {t("dashboard.monthlyDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityAreaChart data={data?.monthlyActivity ?? []} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="lg:whitespace-nowrap">
              {t("dashboard.statusTitle")}
            </CardTitle>
            <CardDescription>
              {t("dashboard.statusDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StatusPieChart data={data?.statusDistribution ?? []} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <div>
          <h2 className="mb-3 text-lg font-medium">
            {t("dashboard.recentTitle")}
          </h2>
          <FarmerTable farmerRecords={data?.recentFarmers ?? []} />
        </div>
      </div>
    </div>
  );
}
