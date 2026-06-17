import { KYFI_API_BASE_URL } from "@/lib/config";

export type MandalRecord = {
  id: number;
  stateName: string;
  districtName: string;
  mandalName: string;
  mandalCode?: string | null;
  districtId?: number | null;
  sourceLabel: string | null;
};

type MandalsResponse = {
  mandals: MandalRecord[];
};

export type DistrictSearchResult = {
  id: number;
  districtCode?: string | null;
  name: string;
  stateName?: string | null;
};

export type VillageSearchResult = {
  id: number;
  name: string;
  villageCode?: string | null;
  mandalId?: number | null;
  districtId?: number | null;
  mandalName?: string | null;
  districtName?: string | null;
  stateName?: string | null;
};

export async function fetchMandals(params: {
  state?: string;
  district?: string;
  query?: string;
}) {
  const searchParams = new URLSearchParams();

  if (params.state) searchParams.set("state", params.state);
  if (params.district) searchParams.set("district", params.district);
  if (params.query) searchParams.set("query", params.query);

  const response = await fetch(
    `${KYFI_API_BASE_URL}/locations/mandals?${searchParams.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  const data = (await response.json().catch(() => null)) as
    | MandalsResponse
    | { message?: string }
    | null;

  if (!response.ok) {
    throw new Error((data as { message?: string } | null)?.message || "Request failed");
  }

  return data as MandalsResponse;
}

export async function searchDistricts(query: string) {
  const searchParams = new URLSearchParams();
  searchParams.set("q", query);

  const response = await fetch(
    `${KYFI_API_BASE_URL}/districts/search?${searchParams.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  const data = (await response.json().catch(() => null)) as {
    districts?: DistrictSearchResult[];
    message?: string;
  } | null;

  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return (
    Array.isArray(data?.districts) ? data.districts : []
  ) as DistrictSearchResult[];
}

export async function searchVillages(params: {
  mandalId: number;
  query: string;
}) {
  const searchParams = new URLSearchParams();
  searchParams.set("mandalId", String(params.mandalId));
  searchParams.set("q", params.query);

  const response = await fetch(
    `${KYFI_API_BASE_URL}/villages/search?${searchParams.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  const data = (await response.json().catch(() => null)) as {
    villages?: VillageSearchResult[];
    message?: string;
  } | null;

  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return (
    Array.isArray(data?.villages) ? data.villages : []
  ) as VillageSearchResult[];
}
