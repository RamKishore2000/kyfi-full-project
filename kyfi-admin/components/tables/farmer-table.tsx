"use client";

import { useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { farmers } from "@/data/mock-data";
import { useFilter } from "@/hooks/use-filter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SearchFilterBar } from "@/components/forms/search-filter-bar";
import { FarmerStatusBadge } from "@/components/tables/status-badge";
import { Pagination } from "@/components/tables/pagination";
import { TableShell, TableToolbar } from "@/components/tables/table-shell";
import { BlacklistWarning } from "@/components/dashboard/blacklist-warning";

export function FarmerTable() {
  const [statusFilter, setStatusFilter] = useState("All");
  const statusFilteredFarmers = useMemo(() => {
    if (statusFilter === "All") return farmers;
    return farmers.filter((farmer) => farmer.status.toLowerCase() === statusFilter.toLowerCase());
  }, [statusFilter]);
  const { query, setQuery, filtered } = useFilter(statusFilteredFarmers, ["name", "id", "district", "mandal", "village", "aadhaarMasked", "phone"]);

  return (
    <TableShell>
      <TableToolbar>
        <SearchFilterBar
          value={query}
          onChange={setQuery}
          placeholder="Search farmer, ID, district..."
          selectedFilter={statusFilter}
          onFilterChange={setStatusFilter}
        />
      </TableToolbar>
      <div className="space-y-3 md:hidden">
        {filtered.map((farmer) => (
          <div key={farmer.id} className={`rounded-lg border p-4 ${farmer.blacklisted ? "bg-red-50/80 dark:bg-red-950/30" : "bg-card"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium leading-5">{farmer.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{farmer.id}</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="shrink-0 px-2">
                    <Eye className="h-4 w-4" />
                    View
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <FarmerDialog farmer={farmer} />
                </DialogContent>
              </Dialog>
            </div>
            <div className="mt-4 grid gap-3 text-sm">
              <Info label="Location" value={`${farmer.village}, ${farmer.mandal}, ${farmer.district}`} />
              <Info label="Aadhaar / Mobile" value={`${farmer.aadhaarMasked} / ${farmer.phone}`} />
              <Info label="Vote count" value={String(farmer.voteCount)} />
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Status</p>
                <div className="mt-2">
                  <FarmerStatusBadge status={farmer.status} blacklisted={farmer.blacklisted} />
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
              <th className="px-4 py-3">Farmer</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Aadhaar / Mobile</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3">Votes</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((farmer) => (
              <tr key={farmer.id} className={farmer.blacklisted ? "bg-red-50/80 dark:bg-red-950/30" : "hover:bg-muted/40"}>
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
                    <FarmerStatusBadge status={farmer.status} blacklisted={farmer.blacklisted} />
                  </div>
                </td>
                <td className="px-4 py-4 align-middle tabular-nums">{farmer.voteCount}</td>
                <td className="px-4 py-4 align-middle">
                  <div className="flex items-center justify-end">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-16 px-2">
                          <Eye className="h-4 w-4" />
                          View
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
      <Pagination total={filtered.length} />
    </TableShell>
  );
}

function FarmerDialog({ farmer }: { farmer: (typeof farmers)[number] }) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>{farmer.name}</DialogTitle>
        <DialogDescription>{farmer.id} farmer detail view</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <BlacklistWarning farmer={farmer} />
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <Info label="Aadhaar" value={farmer.aadhaarMasked} />
          <Info label="Phone" value={farmer.phone} />
          <Info label="Village / Mandal" value={`${farmer.village}, ${farmer.mandal}`} />
          <Info label="District" value={farmer.district} />
          <Info label="Crop" value={farmer.crop} />
          <Info label="Vote count" value={String(farmer.voteCount)} />
          <Info label="Date added" value={farmer.dateAdded} />
          <Info label="Last verified" value={farmer.lastVerified} />
        </div>
        <div className="rounded-md border p-3 text-sm">
          <p className="text-xs text-muted-foreground">Remarks</p>
          <p className="mt-1">{farmer.remarks}</p>
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
