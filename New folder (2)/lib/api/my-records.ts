import { KYFI_API_BASE_URL } from "@/lib/config";
import { handleDealerAccountBlock } from "@/lib/api/account-status";
import { handleSubscriptionExpiry } from "@/lib/api/subscription-expiry";

type ApiErrorPayload = {
  message?: string;
};

export type MyFarmerStatusRecord = {
  id: number;
  aadhaar: string;
  aadhaarMasked?: string;
  farmerName: string;
  mobileNumber?: string | null;
  district: string;
  mandal: string;
  village: string;
  farmerType?: "OLD" | "NEW";
  statusColor: "GREEN" | "YELLOW" | "RED";
  currentDealerVoteColor?: "GREEN" | "YELLOW" | "RED" | null;
  rationCardNumber?: string | null;
  address?: string | null;
  amountPending?: number | null;
  remarks?: string | null;
  createdByDealerId: number;
  voteCount: number;
  createdAt?: string;
  updatedAt?: string;
  blacklisted?: boolean;
  blacklistReason?: string | null;
};

export type MyBlacklistRecord = {
  id: number;
  aadhaar: string;
  aadhaarMasked?: string;
  mobileNumber?: string | null;
  farmerName: string;
  district: string;
  mandal: string;
  village: string;
  reason: string;
  address?: string | null;
  createdByDealerId: number;
  createdAt?: string;
  updatedAt?: string;
};

export type MyRecordsResponse = {
  counts: {
    farmerStatuses: number;
    blacklistEntries: number;
    votes: number;
    countActions: number;
  };
  farmerStatuses: MyFarmerStatusRecord[];
  blacklistEntries: MyBlacklistRecord[];
  votes: MyVoteRecord[];
  countActions: MyCountActionRecord[];
};

export type MyVoteRecord = {
  id: number;
  statusId: number;
  dealerId: number;
  actionType?: "INCREMENT" | "DECREMENT" | string | null;
  actedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  voteColor?: "GREEN" | "YELLOW" | "RED" | null;
  votedAt?: string;
  aadhaar: string;
  aadhaarMasked?: string;
  farmerName: string;
  mobileNumber?: string | null;
  district: string;
  mandal: string;
  village: string;
  farmerType?: "OLD" | "NEW";
  statusColor: "GREEN" | "YELLOW" | "RED";
  farmerCreatedAt?: string;
  farmerUpdatedAt?: string;
};

export type MyCountActionRecord = {
  id: number;
  statusId: number;
  dealerId: number;
  actionType?: "INCREMENT" | "DECREMENT" | string | null;
  actedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  aadhaar: string;
  aadhaarMasked?: string;
  farmerName: string;
  mobileNumber?: string | null;
  district: string;
  mandal: string;
  village: string;
  farmerType?: "OLD" | "NEW";
  statusColor: "GREEN" | "YELLOW" | "RED";
  farmerCreatedAt?: string;
  farmerUpdatedAt?: string;
};

function getToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("kyfi_token") ?? "";
}

export async function fetchMyRecords() {
  const response = await fetch(`${KYFI_API_BASE_URL}/dealer/me/records`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  });

  const data = (await response.json().catch(() => null)) as
    | MyRecordsResponse
    | ApiErrorPayload
    | null;

  if (!response.ok) {
    handleDealerAccountBlock(data);
    handleSubscriptionExpiry(data);
    throw new Error(
      (data as ApiErrorPayload | null)?.message || "Request failed",
    );
  }

  return data as MyRecordsResponse;
}
