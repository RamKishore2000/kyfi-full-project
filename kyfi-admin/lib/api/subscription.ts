import { KYFI_API_BASE_URL } from "@/lib/config";

export type AdminSubscriptionRecord = {
  id: number;
  planName: string;
  yearlyPrice: number;
  currency: string;
  durationLabel: string;
  freeTrialDays: number;
  updatedByAdminId: number | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type SubscriptionResponse = {
  subscription: AdminSubscriptionRecord;
};

async function authFetch(path: string, init: RequestInit = {}) {
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("kyfi_admin_token")
      : null;

  const response = await fetch(`${KYFI_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
}

export async function fetchAdminSubscription() {
  return authFetch("/admin/subscription") as Promise<SubscriptionResponse>;
}

export async function updateAdminSubscription(input: {
  yearlyPrice: number;
  freeTrialDays: number;
}) {
  return authFetch("/admin/subscription", {
    method: "PATCH",
    body: JSON.stringify(input),
  }) as Promise<{ message: string; subscription: AdminSubscriptionRecord }>;
}
