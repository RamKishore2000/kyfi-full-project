import { KYFI_API_BASE_URL } from "@/lib/config";
import type { Farmer } from "@/types";

export type DashboardMetric = {
  label: string;
  value: number;
  change: string;
  tone: "success" | "primary" | "warning" | "danger";
};

export type DashboardMonthlyActivity = {
  month: string;
  farmers: number;
  oldFarmers: number;
  newFarmers: number;
  reports: number;
  approvals: number;
};

export type DashboardStatusDistribution = {
  name: string;
  value: number;
  color: string;
};

export type DashboardSummaryResponse = {
  analytics: DashboardMetric[];
  monthlyActivity: DashboardMonthlyActivity[];
  statusDistribution: DashboardStatusDistribution[];
  recentFarmers: Farmer[];
  summary: {
    totalFarmers: number;
    oldFarmers: number;
    newFarmers: number;
    registeredDealers: number;
    oldFarmerVotes: number;
  };
};

async function authFetch(path: string) {
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("kyfi_admin_token")
      : null;

  const response = await fetch(`${KYFI_API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data as DashboardSummaryResponse;
}

export async function fetchAdminDashboard() {
  return authFetch("/admin/dashboard");
}
