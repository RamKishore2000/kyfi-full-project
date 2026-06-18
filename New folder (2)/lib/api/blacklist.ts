import { KYFI_API_BASE_URL } from "@/lib/config";
import { handleDealerAccountBlock } from "@/lib/api/account-status";
import { handleSubscriptionExpiry } from "@/lib/api/subscription-expiry";

export type BlacklistEntryRecord = {
  id: number;
  aadhaar?: string | null;
  aadhaarMasked?: string | null;
  mobileNumber?: string | null;
  mobileMasked?: string | null;
  farmerName: string;
  district?: string | null;
  mandal: string;
  village: string;
  reason: string;
  address: string | null;
  createdByDealerId: number;
  createdAt: string;
  updatedAt: string;
  reportCount?: number;
  currentDealerReported?: boolean;
};

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

export async function checkBlacklistEntry(input: { mobileNumber: string }) {
  return apiRequest<{ exists: boolean; blacklistEntry: BlacklistEntryRecord | null }>("/blacklist/check", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function addBlacklistEntry(input: {
  mobileNumber: string;
  farmerName: string;
  mandal: string;
  village: string;
  reason: string;
  address?: string;
}) {
  return apiRequest<{ message: string; blacklistEntry: BlacklistEntryRecord }>("/blacklist", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function reportBlacklistEntry(entryId: number) {
  return apiRequest<{ message: string; blacklistEntry: BlacklistEntryRecord }>(`/blacklist/${entryId}/report`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function removeBlacklistEntry(entryId: number) {
  return apiRequest<{ message: string; deleted?: boolean; blacklistEntry: BlacklistEntryRecord | null }>(`/blacklist/${entryId}/report`, {
    method: "DELETE",
    body: JSON.stringify({}),
  });
}

export async function searchBlacklistEntries(input: {
  mandal?: string;
  village?: string;
}) {
  return apiRequest<{ entries: BlacklistEntryRecord[] }>("/blacklist/search", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
