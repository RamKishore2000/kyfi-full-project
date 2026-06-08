import { KYFI_API_BASE_URL } from "@/lib/config";
import type { Farmer } from "@/types";

type FarmersResponse = {
  farmers: Farmer[];
  total: number;
  farmerType?: "OLD" | "NEW";
};

export type FarmerVoteRecord = {
  statusId: number;
  voteEntryId?: number;
  dealerId: number;
  dealerName: string;
  dealerMobile: string;
  voteStatus: string;
  votedAt: string;
  voterType?: "DEALER" | "SUPER_ADMIN";
  voteCount?: number;
  proofImageUrl?: string | null;
};

async function authFetch<TResponse>(path: string, init: RequestInit = {}) {
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

export async function incrementSuperAdminFarmerVote(
  statusId: number,
  proofImageDataUrl: string,
) {
  return authFetch<{
    message: string;
    farmer: {
      statusId: number;
      voteCount: number;
      superAdminVoteCount: number;
    };
  }>(`/admin/farmers/${statusId}/super-vote/increment`, {
    method: "POST",
    body: JSON.stringify({ proofImageDataUrl }),
  });
}

export async function decrementSuperAdminFarmerVote(statusId: number) {
  return authFetch<{
    message: string;
    farmer: {
      statusId: number;
      voteCount: number;
      superAdminVoteCount: number;
    };
  }>(`/admin/farmers/${statusId}/super-vote/decrement`, {
    method: "POST",
  });
}
