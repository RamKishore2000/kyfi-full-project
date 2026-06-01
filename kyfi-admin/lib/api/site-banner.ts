import { KYFI_API_BASE_URL } from "@/lib/config";

export type SiteBannerRecord = {
  desktopImageUrl: string | null;
  mobileImageUrl: string | null;
  desktopImageName: string | null;
  mobileImageName: string | null;
  updatedByDealerId: number | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type SiteBannerResponse = {
  banner: SiteBannerRecord;
};

type UpdateSiteBannerInput = {
  desktopImageDataUrl?: string | null;
  mobileImageDataUrl?: string | null;
};

async function authFetch(path: string, init: RequestInit = {}) {
  const token =
    typeof window !== "undefined" ? window.localStorage.getItem("kyfi_admin_token") : null;

  const response = await fetch(`${KYFI_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {} as HeadersInit),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
}

export async function fetchAdminSiteBanner() {
  return authFetch("/admin/site-banner") as Promise<SiteBannerResponse>;
}

export async function updateAdminSiteBanner(input: UpdateSiteBannerInput) {
  return authFetch("/admin/site-banner", {
    method: "PATCH",
    body: JSON.stringify(input),
  }) as Promise<{ message: string; banner: SiteBannerRecord }>;
}
