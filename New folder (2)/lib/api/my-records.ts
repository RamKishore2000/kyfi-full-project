import { KYFI_API_BASE_URL } from "@/lib/config";

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
  statusColor: "GREEN" | "YELLOW" | "RED";
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
  };
  farmerStatuses: MyFarmerStatusRecord[];
  blacklistEntries: MyBlacklistRecord[];
  votes: MyVoteRecord[];
};

export type MyVoteRecord = {
  id: number;
  statusId: number;
  dealerId: number;
  votedAt?: string;
  aadhaar: string;
  aadhaarMasked?: string;
  farmerName: string;
  mobileNumber?: string | null;
  district: string;
  mandal: string;
  village: string;
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

  const data = (await response.json().catch(() => null)) as MyRecordsResponse | ApiErrorPayload | null;

  if (!response.ok) {
    throw new Error((data as ApiErrorPayload | null)?.message || "Request failed");
  }

  return data as MyRecordsResponse;
}
