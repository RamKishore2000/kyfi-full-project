import { KYFI_API_BASE_URL } from "@/lib/config";

export type SubscriptionRecord = {
  id: number;
  planName: string;
  yearlyPrice: number;
  currency: string;
  durationLabel: string;
  freeTrialDays: number;
  updatedByAdminId: number | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type SubscriptionResponse = {
  subscription: SubscriptionRecord;
};

export type SubscriptionOrder = {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  receipt: string;
  dealerId: number;
  dealerName: string;
  mobile: string;
  planName: string;
  yearlyPrice: number;
  durationLabel: string;
};

export type VerifySubscriptionResponse = {
  message: string;
  dealer: Record<string, unknown>;
};

async function fetchJson(path: string, init: RequestInit = {}) {
  const response = await fetch(`${KYFI_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
}

export async function fetchSubscriptionSettings() {
  return fetchJson("/subscription") as Promise<SubscriptionResponse>;
}

export async function createSubscriptionOrder(input: {
  dealerId: number;
  mobile: string;
}) {
  return fetchJson("/subscription/order", {
    method: "POST",
    body: JSON.stringify(input),
  }) as Promise<{ order: SubscriptionOrder }>;
}

export async function verifySubscriptionPayment(input: {
  dealerId: number;
  mobile: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  return fetchJson("/subscription/verify", {
    method: "POST",
    body: JSON.stringify(input),
  }) as Promise<VerifySubscriptionResponse>;
}
