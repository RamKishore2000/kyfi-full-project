import { KYFI_API_BASE_URL } from "@/lib/config";

export type AdminBlacklistRecord = {
  recordId: number;
  id: string;
  name: string;
  district: string;
  mandal: string;
  village: string;
  crop: string;
  phone: string;
  aadhaarMasked: string;
  panMasked?: string;
  rationCard?: string;
  address?: string;
  status: "GREEN" | "YELLOW" | "RED";
  blacklisted: boolean;
  blacklistReason?: string;
  remarks: string;
  voteCount: number;
  reports: number;
  dateAdded: string;
  lastVerified: string;
  history: string[];
};

type BlacklistResponse = {
  entries: AdminBlacklistRecord[];
  total: number;
};

async function authFetch(path: string) {
  const token =
    typeof window !== "undefined" ? window.localStorage.getItem("kyfi_admin_token") : null;

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

  return data as BlacklistResponse;
}

export async function fetchBlacklistEntries() {
  return authFetch("/admin/blacklist");
}

export async function deleteBlacklistEntry(recordId: number) {
  const token =
    typeof window !== "undefined" ? window.localStorage.getItem("kyfi_admin_token") : null;

  const response = await fetch(`${KYFI_API_BASE_URL}/admin/blacklist/${recordId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data as { message: string };
}
