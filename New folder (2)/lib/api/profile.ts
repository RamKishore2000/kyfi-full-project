import { KYFI_API_BASE_URL } from "@/lib/config";
import type { DealerAuthResponse } from "@/lib/api/auth";
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
    handleSubscriptionExpiry(data);
    throw new Error((data as ApiErrorPayload | null)?.message || "Request failed");
  }

  return data as TResponse;
}

export async function fetchCurrentDealer() {
  return apiRequest<{ dealer: DealerAuthResponse }>("/dealer/me", {
    method: "GET",
  });
}

export async function updateCurrentDealerProfile(input: {
  name: string;
  mobile: string;
  shopName: string;
  district: string;
  state: string;
  mandal: string;
  village: string;
}) {
  return apiRequest<{ message: string; dealer: DealerAuthResponse }>("/dealer/me", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function updateDealerPassword(input: {
  currentPassword: string;
  newPassword: string;
}) {
  return apiRequest<{ message: string }>("/dealer/me/password", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function updateDealerLanguage(input: {
  languagePreference: "en" | "te";
}) {
  return apiRequest<{ message: string; dealer: DealerAuthResponse }>("/dealer/me/settings", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
