import { KYFI_API_BASE_URL } from "@/lib/config";
import type { AdminAccess, AdminPermission } from "@/lib/admin-permissions";

function getToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("kyfi_admin_token") ?? "";
}

export async function adminAuthFetch<T>(path: string, init: RequestInit = {}) {
  const token = getToken();
  const response = await fetch(`${KYFI_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = (await response.json().catch(() => null)) as
    | (T & { message?: string })
    | null;

  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data as T;
}

export async function fetchCurrentAdmin() {
  return adminAuthFetch<{
    admin: AdminAccess;
    permissionsCatalog: AdminPermission[];
  }>("/admin/me");
}
