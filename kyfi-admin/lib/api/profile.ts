import { KYFI_API_BASE_URL } from "@/lib/config";

export type AdminProfile = {
  id: number;
  role: "admin" | "dealer";
  name: string;
  mobile: string;
  shopName: string;
  district: string;
  state: string;
  mandal: string;
  village: string;
  aadhaarOrGstNumber: string;
  status: string;
  languagePreference: "en" | "te";
};

type ProfileResponse = {
  dealer: AdminProfile;
  message?: string;
};

async function authFetch(path: string, init: RequestInit = {}) {
  const token =
    typeof window !== "undefined" ? window.localStorage.getItem("kyfi_admin_token") : null;

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

  return data as ProfileResponse;
}

export async function fetchAdminProfile() {
  return authFetch("/dealer/me");
}

export async function updateAdminProfile(input: Partial<AdminProfile>) {
  return authFetch("/dealer/me", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
