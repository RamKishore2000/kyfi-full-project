import { KYFI_API_BASE_URL } from "@/lib/config";
import { handleDealerAccountBlock } from "@/lib/api/account-status";
import { handleSubscriptionExpiry } from "@/lib/api/subscription-expiry";

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

export type MandalSearchResult = {
  id: number;
  name: string;
  mandalCode?: string | null;
  districtId?: number | null;
  districtName?: string | null;
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

export type DistrictSearchResult = {
  id: number;
  districtCode?: string | null;
  name: string;
  stateName?: string | null;
};

function getToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("kyfi_token") ?? "";
}

async function authenticatedRequest<TResponse>(
  path: string,
  init: RequestInit,
): Promise<TResponse> {
  const response = await fetch(`${KYFI_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
      Authorization: `Bearer ${getToken()}`,
    },
  });

  const data = (await response.json().catch(() => null)) as
    | TResponse
    | { message?: string }
    | null;

  if (!response.ok) {
    handleDealerAccountBlock(data);
    handleSubscriptionExpiry(data);
    throw new Error(
      (data as { message?: string } | null)?.message || "Request failed",
    );
  }

  return data as TResponse;
}

export async function fetchMandals(params: {
  state?: string;
  district?: string;
  query?: string;
}) {
  const useLegacySearch = Boolean(params.state || params.district);
  const searchParams = new URLSearchParams();

  if (params.state) searchParams.set("state", params.state);
  if (params.district) searchParams.set("district", params.district);
  if (params.query)
    searchParams.set(useLegacySearch ? "query" : "q", params.query);

  const endpoint = useLegacySearch
    ? `/locations/mandals?${searchParams.toString()}`
    : `/mandals/search?${searchParams.toString()}`;

  const response = await fetch(`${KYFI_API_BASE_URL}${endpoint}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = (await response.json().catch(() => null)) as
    | MandalsResponse
    | { mandals?: MandalSearchResult[]; message?: string }
    | null;

  if (!response.ok) {
    throw new Error(
      (data as { message?: string } | null)?.message || "Request failed",
    );
  }

  if (useLegacySearch) {
    return data as MandalsResponse;
  }

  const mandals = Array.isArray(
    (data as { mandals?: MandalSearchResult[] } | null)?.mandals,
  )
    ? ((data as { mandals: MandalSearchResult[] }).mandals ?? []).map(
        (item) => ({
          id: item.id,
          stateName: item.stateName ?? "",
          districtName: item.districtName ?? "",
          mandalName: item.name,
          mandalCode: item.mandalCode ?? null,
          districtId: item.districtId ?? null,
          sourceLabel: null,
        }),
      )
    : [];

  return { mandals };
}

export async function searchMandals(query: string) {
  const searchParams = new URLSearchParams();
  searchParams.set("q", query);

  const response = await fetch(
    `${KYFI_API_BASE_URL}/mandals/search?${searchParams.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  const data = (await response.json().catch(() => null)) as {
    mandals?: MandalSearchResult[];
    message?: string;
  } | null;

  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return (
    Array.isArray(data?.mandals) ? data.mandals : []
  ) as MandalSearchResult[];
}

export async function searchDistricts(query: string) {
  const searchParams = new URLSearchParams();
  searchParams.set("q", query);
  const token = getToken();

  const response = await fetch(
    `${KYFI_API_BASE_URL}/districts/search?${searchParams.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

export async function createMandal(input: {
  districtId: number;
  mandalName: string;
  mandalCode?: string | null;
}) {
  return authenticatedRequest<{
    message: string;
    mandal: {
      id: number;
      name: string;
      mandalCode?: string | null;
      districtId?: number | null;
      districtName?: string | null;
      stateName?: string | null;
    } | null;
  }>("/mandals", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function createVillage(input: {
  mandalId: number;
  villageName: string;
  villageCode?: string | null;
}) {
  return authenticatedRequest<{
    message: string;
    village: {
      id: number;
      name: string;
      villageCode?: string | null;
      mandalId?: number | null;
      districtId?: number | null;
      mandalName?: string | null;
      districtName?: string | null;
      stateName?: string | null;
    } | null;
  }>("/villages", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchVillagesByMandal(mandalId: number) {
  const response = await fetch(
    `${KYFI_API_BASE_URL}/villages/by-mandal/${mandalId}`,
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
