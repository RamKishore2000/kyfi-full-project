"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Eye, PauseCircle, X } from "lucide-react";
import { dealers } from "@/data/mock-data";
import type { Dealer } from "@/types";
import { useFilter } from "@/hooks/use-filter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SearchFilterBar } from "@/components/forms/search-filter-bar";
import { DealerStatusBadge } from "@/components/tables/status-badge";
import { Pagination } from "@/components/tables/pagination";
import { TableShell, TableToolbar } from "@/components/tables/table-shell";

export function DealerTable({
  dealerRecords = dealers,
  onStatusChange,
}: {
  dealerRecords?: Dealer[];
  onStatusChange?: (dealerId: string, status: Dealer["status"]) => void | Promise<void>;
}) {
  const [statusFilter, setStatusFilter] = useState("All");
  const statusFilteredDealers = useMemo(() => {
    if (statusFilter === "All") return dealerRecords;
    return dealerRecords.filter((dealer) => dealer.status === statusFilter);
  }, [dealerRecords, statusFilter]);
  const { query, setQuery, filtered } = useFilter(statusFilteredDealers, ["name", "ownerName", "mobile", "id", "district", "mandal", "village", "licenseId"]);

  return (
    <TableShell>
      <TableToolbar>
        <SearchFilterBar
          value={query}
          onChange={setQuery}
          placeholder="Search dealer, owner, mobile, mandal..."
          filters={["All", "Pending", "Approved", "Suspended"]}
          selectedFilter={statusFilter}
          onFilterChange={setStatusFilter}
        />
      </TableToolbar>
      <div className="space-y-3 md:hidden">
        {filtered.map((dealer) => (
          <div key={dealer.id} className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium leading-5">{dealer.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{dealer.ownerName} - {dealer.id}</p>
              </div>
            <DealerActions dealer={dealer} onStatusChange={onStatusChange} />
            </div>
            <div className="mt-4 grid gap-3 text-sm">
              <Info label="Location" value={`${dealer.village}, ${dealer.mandal}, ${dealer.district}`} />
              <Info label="Mobile number" value={dealer.mobile} />
              <Info label="Farmers linked" value={String(dealer.farmersLinked)} />
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Status</p>
                <div className="mt-2">
                  <DealerStatusBadge status={dealer.status} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="hidden overflow-hidden md:block">
        <table className="w-full table-fixed text-left text-sm leading-6">
          <colgroup>
            <col className="w-[26%]" />
            <col className="w-[18%]" />
            <col className="w-[22%]" />
            <col className="w-[17%]" />
            <col className="w-[16%]" />
          </colgroup>
          <thead className="bg-muted/60 text-xs font-semibold uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Dealer</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Mobile number</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((dealer) => (
              <tr key={dealer.id} className="hover:bg-muted/40">
                <td className="px-4 py-4 align-middle">
                  <div className="truncate font-medium leading-5">{dealer.name}</div>
                  <div className="text-xs text-muted-foreground">{dealer.ownerName} - {dealer.id}</div>
                </td>
                <td className="px-4 py-4 align-middle">
                  <div className="truncate">{dealer.village}</div>
                  <div className="text-xs text-muted-foreground">{dealer.mandal}, {dealer.district}</div>
                </td>
                <td className="px-4 py-4 align-middle">
                  <div className="break-words leading-6">{dealer.mobile}</div>
                </td>
                <td className="px-4 py-4 align-middle">
                  <div className="flex justify-center">
                    <DealerStatusBadge status={dealer.status} />
                  </div>
                </td>
                <td className="px-4 py-4 align-middle">
                <DealerActions dealer={dealer} onStatusChange={onStatusChange} />
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

const actionLabels = {
  approve: "Approve",
  reject: "Reject",
  suspend: "Suspend",
  view: "View",
};

type DealerAction = keyof typeof actionLabels;

function DealerActions({
  dealer,
  onStatusChange,
}: {
  dealer: Dealer;
  onStatusChange?: (dealerId: string, status: Dealer["status"]) => void | Promise<void>;
}) {
  const [viewOpen, setViewOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<DealerAction>("approve");

  return (
    <div className="flex justify-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="w-32 justify-between px-3">
            <span className="truncate">{actionLabels[selectedAction]}</span>
            <ChevronDown className="h-4 w-4 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="min-w-36">
          <DropdownMenuItem
            onSelect={() => {
              setSelectedAction("approve");
              void onStatusChange?.(dealer.id, "Approved");
            }}
          >
            <Check className="h-4 w-4 text-success" />
            Approve
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              setSelectedAction("reject");
              void onStatusChange?.(dealer.id, "Rejected");
            }}
          >
            <X className="h-4 w-4 text-muted-foreground" />
            Reject
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              setSelectedAction("suspend");
              void onStatusChange?.(dealer.id, "Suspended");
              setSuspendOpen(true);
            }}
          >
            <PauseCircle className="h-4 w-4 text-danger" />
            Suspend
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              setSelectedAction("view");
              setViewOpen(true);
            }}
          >
            <Eye className="h-4 w-4 text-muted-foreground" />
            View
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={suspendOpen} onOpenChange={setSuspendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend dealer</DialogTitle>
            <DialogDescription>Temporarily block onboarding and profile changes for this dealer.</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Suspend {dealer.name} from onboarding new farmer records?</p>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSuspendOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => setSuspendOpen(false)}>Suspend</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{dealer.name}</DialogTitle>
            <DialogDescription>Dealer verification and linked farmer details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Info label="Farmers linked" value={String(dealer.farmersLinked)} />
            <Info label="Owner" value={dealer.ownerName} />
            <Info label="Mobile" value={dealer.mobile} />
            <Info label="Location" value={`${dealer.village}, ${dealer.mandal}, ${dealer.district}`} />
            <Info label="Joined" value={dealer.joined} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
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
