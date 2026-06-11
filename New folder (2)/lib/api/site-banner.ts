import { KYFI_API_BASE_URL } from "@/lib/config";

export type SiteBannerRecord = {
  desktopImageUrl: string | null;
  mobileImageUrl: string | null;
  mobileImageUrls?: string[];
  desktopImageName: string | null;
  mobileImageName: string | null;
  mobileImageNames?: Array<string | null>;
  updatedByDealerId: number | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type SiteBannerResponse = {
  banner: SiteBannerRecord;
};

export async function fetchSiteBanner() {
  const response = await fetch(`${KYFI_API_BASE_URL}/site-banner`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = (await response.json().catch(() => null)) as
    | SiteBannerResponse
    | { message?: string }
    | null;

  if (!response.ok) {
    const errorData = data as { message?: string } | null;
    throw new Error(errorData?.message || "Request failed");
  }

  return data as SiteBannerResponse;
}
