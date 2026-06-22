import { KYFI_API_BASE_URL } from "@/lib/config";

export type RegisterDealerInput = {
  shopName: string;
  ownerName: string;
  mobile: string;
  password?: string;
  district: string;
  state: string;
  mandal: string;
  village: string;
  aadhaarNumber?: string;
  gstNumber?: string;
  aadhaarOrGstNumber?: string;
};

export type LoginPasswordInput = {
  mobile: string;
  password: string;
};

export type LoginOtpInput = {
  mobile: string;
  otp: string;
};

export type DealerAuthResponse = {
  id?: number;
  role?: "dealer" | "admin";
  name?: string;
  mobile?: string;
  shopName?: string;
  district?: string;
  state?: string;
  mandal?: string;
  village?: string;
  aadhaarNumber?: string | null;
  gstNumber?: string | null;
  aadhaarOrGstNumber?: string;
  status?: "pending" | "approved" | "rejected" | "suspended";
  languagePreference?: "en" | "te";
  subscriptionStatus?: "inactive" | "active";
  subscriptionPlanName?: string | null;
  subscriptionYearlyPrice?: number | null;
  subscriptionStartedAt?: string | null;
  subscriptionExpiresAt?: string | null;
  trialStatus?: "inactive" | "active" | "expired";
  trialStartedAt?: string | null;
  trialExpiresAt?: string | null;
  trialDaysRemaining?: number | null;
  accessStatus?: "allowed" | "subscription_required";
  hasActiveSubscription?: boolean;
  hasActiveTrial?: boolean;
};

type ApiErrorPayload = {
  message?: string;
};

async function apiRequest<TResponse>(
  path: string,
  init: RequestInit,
): Promise<TResponse> {
  const response = await fetch(`${KYFI_API_BASE_URL}${path}`, init);
  const data = (await response.json().catch(() => null)) as
    | TResponse
    | ApiErrorPayload
    | null;

  if (!response.ok) {
    throw new Error(
      (data as ApiErrorPayload | null)?.message || "Request failed",
    );
  }

  return data as TResponse;
}

export async function registerDealer(input: RegisterDealerInput) {
  return apiRequest<{ message: string; dealer: DealerAuthResponse }>(
    "/register",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );
}

export async function loginDealerPassword(input: LoginPasswordInput) {
  return apiRequest<{
    message: string;
    token: string;
    dealer: DealerAuthResponse;
  }>("/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...input,
      mode: "password",
    }),
  });
}

export async function loginDealerOtp(input: LoginOtpInput) {
  return apiRequest<{
    message: string;
    token: string;
    dealer: DealerAuthResponse;
  }>("/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...input,
      mode: "otp",
    }),
  });
}
