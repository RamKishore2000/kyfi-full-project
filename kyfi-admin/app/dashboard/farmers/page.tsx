"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/navigation/page-header";
import { FarmerTable } from "@/components/tables/farmer-table";
import { Card, CardContent } from "@/components/ui/card";
import { fetchFarmers } from "@/lib/api/farmers";
import type { Farmer } from "@/types";

export default function FarmersPage() {
  const [farmers, setFarmers] = useState<Farmer[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetchFarmers()
      .then((response) => setFarmers(response.farmers))
      .catch((farmersError) => {
        setError(farmersError instanceof Error ? farmersError.message : "Unable to load farmers");
      });
  }, []);

  return (
    <>
      <PageHeader
        title="Farmer records"
        description="Search, filter, inspect, and review farmer status records by district, mandal, village, status, and date."
      />

      {error ? (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      ) : null}

      <FarmerTable farmerRecords={farmers ?? []} />
    </>
  );
}
