import { KYFI_API_BASE_URL } from "@/lib/config";

export type MandalRecord = {
  id: number;
  stateName: string;
  districtName: string;
  mandalName: string;
  sourceLabel: string | null;
};

type MandalsResponse = {
  mandals: MandalRecord[];
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
