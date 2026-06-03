import { KYFI_API_BASE_URL } from "@/lib/config";

export type FarmerStatusColor = "GREEN" | "YELLOW" | "RED";

export type FarmerStatusRecord = {
  id: number;
  aadhaar: string | null;
  aadhaarMasked: string | null;
  farmerName: string;
  mobileNumber: string | null;
  farmerType: "OLD" | "NEW";
  district: string;
  mandal: string;
  village: string;
  districtId?: number | null;
  mandalId?: number | null;
  villageId?: number | null;
  statusColor: FarmerStatusColor;
  rationCardNumber: string | null;
  address: string | null;
  amountPending: number | null;
  remarks: string | null;
  createdByDealerId: number;
  voteCount: number;
  createdAt: string;
  updatedAt: string;
  currentDealerVoted?: boolean;
  canVote?: boolean;
  currentDealerVoteColor?: FarmerStatusColor | null;
  currentDealerCountAction?: "INCREMENT" | "DECREMENT" | null;
  canIncrement?: boolean;
  canDecrement?: boolean;
  canManageStatus?: boolean;
  blacklisted?: boolean;
  blacklistReason?: string | null;
  blacklistEntryId?: number | null;
  voteBreakdown?: Record<FarmerStatusColor, number>;
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
    throw new Error((data as ApiErrorPayload | null)?.message || "Request failed");
  }

  return data as TResponse;
}

export async function checkFarmerStatus(input: {
  aadhaar?: string;
  mobileNumber?: string;
}) {
  return apiRequest<{ exists: boolean; farmerStatus: FarmerStatusRecord | null }>("/farmer-statuses/check", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function addFarmerStatus(input: {
  aadhaar?: string;
  farmerType?: "OLD" | "NEW";
  farmerName: string;
  mobileNumber?: string;
  district: string;
  mandal: string;
  village: string;
  districtId?: number | null;
  mandalId?: number | null;
  villageId?: number | null;
  statusColor: FarmerStatusColor;
  rationCardNumber?: string;
  address?: string;
  amountPending?: number | null;
  remarks?: string;
}) {
  return apiRequest<{ message: string; farmerStatus: FarmerStatusRecord }>("/farmer-statuses", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function voteFarmerStatus(
  statusId: number,
  voteColor: FarmerStatusColor,
) {
  return apiRequest<{ message: string; farmerStatus: FarmerStatusRecord | null }>(
    `/farmer-statuses/${statusId}/vote`,
    {
      method: "POST",
      body: JSON.stringify({ voteColor }),
    },
  );
}

export async function incrementFarmerStatusCount(statusId: number) {
  return apiRequest<{ message: string; farmerStatus: FarmerStatusRecord | null }>(
    `/farmer-statuses/${statusId}/increment`,
    {
      method: "POST",
    },
  );
}

export async function decrementFarmerStatusCount(statusId: number) {
  return apiRequest<{ message: string; farmerStatus: FarmerStatusRecord | null }>(
    `/farmer-statuses/${statusId}/decrement`,
    {
      method: "POST",
    },
  );
}
