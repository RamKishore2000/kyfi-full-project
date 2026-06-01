"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ShieldAlert } from "lucide-react";
import type { AdminBlacklistRecord } from "@/lib/api/blacklist";
import { useFilter } from "@/hooks/use-filter";
import { Button } from "@/components/ui/button";
import { SearchFilterBar } from "@/components/forms/search-filter-bar";
import { FarmerStatusBadge } from "@/components/tables/status-badge";
import { BlacklistWarning } from "@/components/dashboard/blacklist-warning";
import { useAdminLanguage } from "@/components/admin-language-provider";

type BlacklistListProps = {
  records?: AdminBlacklistRecord[];
  onRemove?: (recordId: number) => Promise<void> | void;
};

export function BlacklistList({ records = [], onRemove }: BlacklistListProps) {
  const { t } = useAdminLanguage();
  const [statusFilter, setStatusFilter] = useState("All");
  const statusFilteredFarmers = useMemo(() => {
    if (statusFilter === "All") return records;
    if (statusFilter === "GREEN + Blacklisted") return records.filter((farmer) => farmer.status === "GREEN");
    if (statusFilter === "YELLOW + Blacklisted") return records.filter((farmer) => farmer.status === "YELLOW");
    if (statusFilter === "RED + Blacklisted") return records.filter((farmer) => farmer.status === "RED");
    return records;
  }, [records, statusFilter]);

  const { query, setQuery, filtered } = useFilter(statusFilteredFarmers, [
    "name",
    "id",
    "district",
    "mandal",
    "village",
    "aadhaarMasked",
  ]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4 shadow-soft">
        <SearchFilterBar
          value={query}
          onChange={setQuery}
          placeholder={t("table.searchBlacklist")}
          filters={["All", "GREEN + Blacklisted", "YELLOW + Blacklisted", "RED + Blacklisted"]}
          selectedFilter={statusFilter}
          onFilterChange={setStatusFilter}
          showFiltersButton={false}
        />
      </div>

      {filtered.length ? (
        filtered.map((farmer) => (
          <details
            key={farmer.id}
            className="group overflow-hidden rounded-lg border border-red-200 bg-card shadow-soft dark:border-red-950"
          >
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
                <FarmerStatusBadge status={farmer.status} blacklisted={farmer.blacklisted} showStatusBadge={false} />
                <ChevronDown className="h-4 w-4 shrink-0 transition group-open:rotate-180" />
              </div>
            </summary>
              <div className="space-y-4 border-t p-5">
                <BlacklistWarning farmer={farmer as never} />
                <div className="grid gap-3 text-sm sm:grid-cols-3">
                <Info label={t("table.reason")} value={farmer.blacklistReason ?? "Confirmed blacklist entry"} />
                <Info label={t("table.address")} value={farmer.address ?? `${farmer.village}, ${farmer.mandal}`} />
                <Info label={t("table.dateAdded")} value={farmer.dateAdded} />
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="danger"
                    onClick={() => void onRemove?.(farmer.recordId)}
                  >
                  {t("table.removeBlacklist")}
                  </Button>
                </div>
              </div>
          </details>
        ))
      ) : (
        <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground shadow-soft">
        {t("blacklist.noRecord")}
        </div>
      )}
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
