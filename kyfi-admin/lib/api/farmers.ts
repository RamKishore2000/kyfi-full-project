import { KYFI_API_BASE_URL } from "@/lib/config";
import type { Farmer } from "@/types";

type FarmersResponse = {
  farmers: Farmer[];
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

  return data as FarmersResponse;
}

export async function fetchFarmers() {
  return authFetch("/admin/farmers");
}
