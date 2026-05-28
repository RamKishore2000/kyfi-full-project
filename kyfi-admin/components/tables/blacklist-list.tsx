"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ShieldAlert } from "lucide-react";
import { farmers } from "@/data/mock-data";
import { useFilter } from "@/hooks/use-filter";
import { Button } from "@/components/ui/button";
import { SearchFilterBar } from "@/components/forms/search-filter-bar";
import { FarmerStatusBadge } from "@/components/tables/status-badge";
import { BlacklistWarning } from "@/components/dashboard/blacklist-warning";

export function BlacklistList() {
  const blacklisted = farmers.filter((farmer) => farmer.blacklisted);
  const [statusFilter, setStatusFilter] = useState("All");
  const statusFilteredFarmers = useMemo(() => {
    if (statusFilter === "All") return blacklisted;
    if (statusFilter === "Confirmed non-payment") return blacklisted.filter((farmer) => farmer.blacklistReason);
    if (statusFilter === "GREEN + Blacklisted") return blacklisted.filter((farmer) => farmer.status === "GREEN");
    if (statusFilter === "RED + Blacklisted") return blacklisted.filter((farmer) => farmer.status === "RED");
    return blacklisted;
  }, [blacklisted, statusFilter]);
  const { query, setQuery, filtered } = useFilter(statusFilteredFarmers, ["name", "id", "district", "mandal", "village", "aadhaarMasked"]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4 shadow-soft">
        <SearchFilterBar
          value={query}
          onChange={setQuery}
          placeholder="Search blacklist by name, Aadhaar, mandal, village..."
          filters={["All", "Confirmed non-payment", "GREEN + Blacklisted", "RED + Blacklisted"]}
          selectedFilter={statusFilter}
          onFilterChange={setStatusFilter}
        />
      </div>

      {filtered.map((farmer) => (
        <details key={farmer.id} className="group overflow-hidden rounded-lg border border-red-200 bg-card shadow-soft dark:border-red-950">
          <summary className="grid cursor-pointer list-none gap-4 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-100 text-blacklist dark:bg-red-950 dark:text-red-200">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold leading-5">{farmer.name}</p>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  {farmer.village} - {farmer.mandal} - {farmer.aadhaarMasked}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 md:justify-end">
              <FarmerStatusBadge status={farmer.status} blacklisted={farmer.blacklisted} />
              <ChevronDown className="h-4 w-4 shrink-0 transition group-open:rotate-180" />
            </div>
          </summary>
          <div className="space-y-4 border-t p-5">
            <BlacklistWarning farmer={farmer} />
            <div className="grid gap-3 text-sm sm:grid-cols-3">
              <Info label="Reason" value={farmer.blacklistReason ?? "Confirmed blacklist entry"} />
              <Info label="Address" value={farmer.address ?? `${farmer.village}, ${farmer.mandal}`} />
              <Info label="Date added" value={farmer.dateAdded} />
            </div>
            <div className="grid gap-2 sm:flex sm:justify-end">
              <Button variant="outline">View History</Button>
              <Button variant="danger">Remove Entry</Button>
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs font-semibold uppercase leading-4 text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium leading-6">{value}</p>
    </div>
  );
}
