import { KYFI_API_BASE_URL } from "@/lib/config";

export type AdminDealerStatus = "pending" | "approved" | "rejected" | "suspended";

export type AdminDealerRecord = {
  id: number;
  role: "dealer";
  name: string;
  mobile: string;
  shopName: string;
  district: string;
  state: string;
  mandal: string;
  village: string;
  aadhaarOrGstNumber: string;
  status: AdminDealerStatus;
  createdAt?: string;
  updatedAt?: string;
};

type DealersResponse = {
  dealers: AdminDealerRecord[];
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

  return data;
}

export async function fetchDealers() {
  return authFetch("/admin/dealers") as Promise<DealersResponse>;
}

export async function updateDealerStatus(
  dealerId: number,
  status: Exclude<AdminDealerStatus, "pending">,
) {
  return authFetch(`/admin/dealers/${dealerId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  }) as Promise<{ message: string; dealer: { id: number; status: string } }>;
}
