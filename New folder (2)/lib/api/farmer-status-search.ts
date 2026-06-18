import { KYFI_API_BASE_URL } from "@/lib/config";
import type { FarmerStatusRecord } from "@/lib/api/farmer-status";
import { handleDealerAccountBlock } from "@/lib/api/account-status";
import { handleSubscriptionExpiry } from "@/lib/api/subscription-expiry";

type ApiErrorPayload = {
  message?: string;
};

function getToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("kyfi_token") ?? "";
}

async function apiRequest<TResponse>(path: string, init: RequestInit): Promise<TResponse> {
  const response = await fetch(`${KYFI_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
      Authorization: `Bearer ${getToken()}`,
    },
  });

  const data = (await response.json().catch(() => null)) as TResponse | ApiErrorPayload | null;

  if (!response.ok) {
    handleDealerAccountBlock(data);
    handleSubscriptionExpiry(data);
    throw new Error((data as ApiErrorPayload | null)?.message || "Request failed");
  }

  return data as TResponse;
}

export async function searchFarmerStatuses(input: {
  mandal?: string;
  village?: string;
  farmer_name?: string;
  term?: string;
}) {
  return apiRequest<{ results: FarmerStatusRecord[] }>("/farmer-statuses/search", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
