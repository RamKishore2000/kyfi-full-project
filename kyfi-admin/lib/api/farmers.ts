import { KYFI_API_BASE_URL } from "@/lib/config";
import type { Farmer } from "@/types";

type FarmersResponse = {
  farmers: Farmer[];
  total: number;
  farmerType?: "OLD" | "NEW";
};

export type FarmerVoteRecord = {
  statusId: number;
  dealerId: number;
  dealerName: string;
  dealerMobile: string;
  voteStatus: string;
  votedAt: string;
};

async function authFetch<TResponse>(path: string) {
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

  return data as TResponse;
}

export async function fetchFarmers(farmerType: "OLD" | "NEW" = "OLD") {
  return authFetch<FarmersResponse>(`/admin/farmers?farmerType=${farmerType}`);
}

export async function fetchFarmerVotes(statusId: number) {
  return authFetch<{
    votes: FarmerVoteRecord[];
    total: number;
  }>(`/admin/farmers/${statusId}/votes`);
}
