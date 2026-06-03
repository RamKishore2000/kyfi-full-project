"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { farmers } from "@/data/mock-data";
import type { Farmer } from "@/types";
import { useFilter } from "@/hooks/use-filter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SearchFilterBar } from "@/components/forms/search-filter-bar";
import { FarmerStatusBadge } from "@/components/tables/status-badge";
import { Pagination } from "@/components/tables/pagination";
import { TableShell, TableToolbar } from "@/components/tables/table-shell";
import { useAdminLanguage } from "@/components/admin-language-provider";

export function FarmerTable({ farmerRecords = farmers }: { farmerRecords?: Farmer[] } = {}) {
  return <FarmerTableContent farmerRecords={farmerRecords} />;
}

export function FarmerTableContent({ farmerRecords = farmers }: { farmerRecords?: Farmer[] }) {
  const { t } = useAdminLanguage();
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const statusFilteredFarmers = useMemo(() => {
    if (statusFilter === "All") return farmerRecords;
    return farmerRecords.filter((farmer) => farmer.status.toLowerCase() === statusFilter.toLowerCase());
  }, [farmerRecords, statusFilter]);
  const { query, setQuery, filtered } = useFilter(statusFilteredFarmers, ["name", "id", "district", "mandal", "village", "aadhaarMasked", "phone"]);
  const statusCounts = useMemo(() => {
    return filtered.reduce(
      (counts, farmer) => {
        if (farmer.status === "GREEN") counts.green += 1;
        if (farmer.status === "YELLOW") counts.yellow += 1;
        if (farmer.status === "RED") counts.red += 1;
        return counts;
      },
      { green: 0, yellow: 0, red: 0 },
    );
  }, [filtered]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedFarmers = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page]
  );

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, farmerRecords]);

  const handlePrev = () => {
    setPage((current) => Math.max(1, current - 1));
  };

  const handleNext = () => {
    setPage((current) => Math.min(totalPages, current + 1));
  };

  return (
    <TableShell>
      <TableToolbar>
        <SearchFilterBar
          value={query}
          onChange={setQuery}
          placeholder={t("table.searchFarmer")}
          selectedFilter={statusFilter}
          onFilterChange={setStatusFilter}
          showFiltersButton={false}
        />
      </TableToolbar>
      <div className="space-y-3 md:hidden">
        {paginatedFarmers.map((farmer) => (
          <div key={farmer.id} className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium leading-5">{farmer.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{farmer.id}</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="shrink-0 px-2">
                    <Eye className="h-4 w-4" />
                    {t("table.view")}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <FarmerDialog farmer={farmer} />
                </DialogContent>
              </Dialog>
            </div>
            <div className="mt-4 grid gap-3 text-sm">
              <Info label={t("table.location")} value={`${farmer.village}, ${farmer.mandal}, ${farmer.district}`} />
              <Info label={t("table.aadhaarMobile")} value={`${farmer.aadhaarMasked} / ${farmer.phone}`} />
              <Info label={t("table.votes")} value={String(farmer.voteCount)} />
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">{t("table.status")}</p>
                <div className="mt-2">
                  <FarmerStatusBadge status={farmer.status} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="hidden overflow-hidden md:block">
        <table className="w-full table-fixed text-left text-sm leading-6">
          <colgroup>
            <col className="w-[24%]" />
            <col className="w-[24%]" />
            <col className="w-[20%]" />
            <col className="w-[14%]" />
            <col className="w-[10%]" />
            <col className="w-[8%]" />
          </colgroup>
          <thead className="bg-muted/60 text-xs font-semibold uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">{t("table.farmer")}</th>
              <th className="px-4 py-3">{t("table.location")}</th>
              <th className="px-4 py-3">{t("table.aadhaarMobile")}</th>
              <th className="px-4 py-3 text-center">{t("table.status")}</th>
              <th className="px-4 py-3">{t("table.votes")}</th>
              <th className="px-4 py-3 text-right">{t("table.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {paginatedFarmers.map((farmer) => (
              <tr key={farmer.id} className="hover:bg-muted/40">
                <td className="px-4 py-4 align-middle">
                  <div className="truncate font-medium leading-5">{farmer.name}</div>
                  <div className="text-xs text-muted-foreground">{farmer.id}</div>
                </td>
                <td className="px-4 py-4 align-middle">
                  <div>{farmer.village}</div>
                  <div className="text-xs text-muted-foreground">{farmer.mandal}, {farmer.district}</div>
                </td>
                <td className="px-4 py-4 align-middle">
                  <div className="tabular-nums">{farmer.aadhaarMasked}</div>
                  <div className="text-xs text-muted-foreground">{farmer.phone}</div>
                </td>
                <td className="px-4 py-4 align-middle">
                  <div className="flex justify-center">
                    <FarmerStatusBadge status={farmer.status} />
                  </div>
                </td>
                <td className="px-4 py-4 align-middle tabular-nums">{farmer.voteCount}</td>
                <td className="px-4 py-4 align-middle">
                  <div className="flex items-center justify-end">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-16 px-2">
                          <Eye className="h-4 w-4" />
                          {t("table.view")}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <FarmerDialog farmer={farmer} />
                      </DialogContent>
                    </Dialog>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination total={filtered.length} pageSize={pageSize} page={page} onPrev={handlePrev} onNext={handleNext} />
    </TableShell>
  );
}

function FarmerDialog({ farmer }: { farmer: Farmer }) {
  const { t } = useAdminLanguage();
  return (
    <>
      <DialogHeader>
        <DialogTitle>{farmer.name}</DialogTitle>
        <DialogDescription>{farmer.id} {t("table.detailView")}</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <Info label={t("table.aadhaarMobile")} value={farmer.aadhaarMasked} />
          <Info label={t("table.mobile")} value={farmer.phone} />
          <Info label={t("table.villageMandalDistrict")} value={`${farmer.village}, ${farmer.mandal}`} />
          <Info label={t("table.district")} value={farmer.district} />
          <Info label={t("table.votes")} value={String(farmer.voteCount)} />
          <Info label={t("table.dateAdded")} value={farmer.dateAdded} />
          <Info label={t("table.lastVerified")} value={farmer.lastVerified} />
        </div>
      </div>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-normal">{value}</p>
    </div>
  );
}
