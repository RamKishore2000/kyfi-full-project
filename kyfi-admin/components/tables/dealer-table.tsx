"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Eye, PauseCircle, X } from "lucide-react";
import { dealers } from "@/data/mock-data";
import type { Dealer } from "@/types";
import { useFilter } from "@/hooks/use-filter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchFilterBar } from "@/components/forms/search-filter-bar";
import { DealerStatusBadge } from "@/components/tables/status-badge";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/tables/pagination";
import { TableShell, TableToolbar } from "@/components/tables/table-shell";
import { useAdminLanguage } from "@/components/admin-language-provider";

export function DealerTable({
  dealerRecords = dealers,
  onStatusChange,
  canChangeStatus = true,
}: {
  dealerRecords?: Dealer[];
  onStatusChange?: (
    dealerId: string,
    status: Dealer["status"],
  ) => void | Promise<void>;
  canChangeStatus?: boolean;
}) {
  const { t } = useAdminLanguage();
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const statusFilteredDealers = useMemo(() => {
    if (statusFilter === "All") return dealerRecords;
    return dealerRecords.filter((dealer) => dealer.status === statusFilter);
  }, [dealerRecords, statusFilter]);
  const { query, setQuery, filtered } = useFilter(statusFilteredDealers, [
    "name",
    "ownerName",
    "mobile",
    "id",
    "district",
    "mandal",
    "village",
    "licenseId",
    "subscriptionStatus",
    "subscriptionPlanName",
  ]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedDealers = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page],
  );

  const handlePrev = () => setPage((current) => Math.max(1, current - 1));
  const handleNext = () =>
    setPage((current) => Math.min(totalPages, current + 1));

  useEffect(() => {
    setPage(1);
  }, [statusFilter, query]);

  return (
    <TableShell>
      <TableToolbar>
        <SearchFilterBar
          value={query}
          onChange={setQuery}
          placeholder={t("table.searchDealer")}
          filters={["All", "Pending", "Approved", "Suspended"]}
          selectedFilter={statusFilter}
          onFilterChange={setStatusFilter}
          showFiltersButton={false}
        />
      </TableToolbar>
      <div className="space-y-3 md:hidden">
        {paginatedDealers.map((dealer) => (
          <div key={dealer.id} className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium leading-5">{dealer.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {dealer.ownerName} - {dealer.id}
                </p>
              </div>
              <DealerActions
                dealer={dealer}
                onStatusChange={onStatusChange}
                canChangeStatus={canChangeStatus}
              />
            </div>
            <div className="mt-4 grid gap-3 text-sm">
              <Info
                label={t("table.location")}
                value={`${dealer.village}, ${dealer.mandal}, ${dealer.district}`}
              />
              <Info label={t("table.mobile")} value={dealer.mobile} />
              <Info
                label={t("table.farmersLinkedLabel")}
                value={String(dealer.farmersLinked)}
              />
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">
                  {t("table.status")}
                </p>
                <div className="mt-2">
                  <DealerStatusBadge status={dealer.status} />
                </div>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">
                  {t("table.subscriptionStatus")}
                </p>
                <div className="mt-2">
                  <Badge
                    className="w-24 justify-center"
                    variant={
                      dealer.subscriptionStatus === "active" ? "green" : "muted"
                    }
                  >
                    {dealer.subscriptionStatus === "active"
                      ? t("table.active")
                      : t("table.inactive")}
                  </Badge>
                </div>
              </div>
              <Info
                label={t("table.subscriptionExpiry")}
                value={formatDate(dealer.subscriptionExpiresAt)}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-[1080px] w-full table-fixed text-left text-sm leading-6">
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[16%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[20%]" />
            </colgroup>
            <thead className="text-xs font-semibold uppercase text-muted-foreground">
              <tr>
                <th className="bg-muted/60 px-4 py-3">{t("table.dealer")}</th>
                <th className="bg-muted/60 px-4 py-3">{t("table.location")}</th>
                <th className="bg-muted/60 px-4 py-3">
                  {t("table.mobileNumber")}
                </th>
                <th className="bg-muted/60 px-4 py-3 text-center">
                  {t("table.status")}
                </th>
                <th className="bg-muted/60 px-4 py-3 text-center">
                  {t("table.subscriptionStatus")}
                </th>
                <th className="bg-muted/60 px-4 py-3 text-center">
                  {t("table.subscriptionExpiry")}
                </th>
                <th className="bg-muted/60 px-4 py-3 text-center">
                  {t("table.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedDealers.map((dealer) => (
                <tr key={dealer.id} className="hover:bg-muted/40">
                  <td className="px-4 py-4 align-middle">
                    <div className="truncate font-medium leading-5">
                      {dealer.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {dealer.ownerName} - {dealer.id}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <div className="truncate">{dealer.village}</div>
                    <div className="text-xs text-muted-foreground">
                      {dealer.mandal}, {dealer.district}
                    </div>
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
                    <div className="flex justify-center">
                      <Badge
                        className="w-24 justify-center"
                        variant={
                          dealer.subscriptionStatus === "active"
                            ? "green"
                            : "muted"
                        }
                      >
                        {dealer.subscriptionStatus === "active"
                          ? t("table.active")
                          : t("table.inactive")}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-middle text-center">
                    <div className="whitespace-nowrap">
                      {formatDate(dealer.subscriptionExpiresAt)}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <DealerActions
                      dealer={dealer}
                      onStatusChange={onStatusChange}
                      canChangeStatus={canChangeStatus}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination
        total={filtered.length}
        pageSize={pageSize}
        page={page}
        onPrev={handlePrev}
        onNext={handleNext}
      />
    </TableShell>
  );
}

type DealerAction = "approve" | "reject" | "suspend" | "view";

function DealerActions({
  dealer,
  onStatusChange,
  canChangeStatus,
}: {
  dealer: Dealer;
  onStatusChange?: (
    dealerId: string,
    status: Dealer["status"],
  ) => void | Promise<void>;
  canChangeStatus: boolean;
}) {
  const { t } = useAdminLanguage();
  const [viewOpen, setViewOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<DealerAction>("approve");
  const statusLabel = t(`table.${dealer.status.toLowerCase()}`);

  return (
    <div className="flex justify-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-32 justify-between border-slate-800 bg-slate-950 px-3 text-slate-100 hover:border-slate-700 hover:bg-slate-900 hover:text-white"
          >
            <span className="truncate">{statusLabel}</span>
            <ChevronDown className="h-4 w-4 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="center"
          className="min-w-36 border-slate-800 bg-slate-950 text-slate-100"
        >
          <DropdownMenuItem
            onSelect={() => {
              setSelectedAction("approve");
              void onStatusChange?.(dealer.id, "Approved");
            }}
            className={canChangeStatus ? "focus:bg-slate-900" : "hidden"}
          >
            <Check className="h-4 w-4 text-success" />
            {t("table.approve")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              setSelectedAction("reject");
              void onStatusChange?.(dealer.id, "Rejected");
            }}
            className={canChangeStatus ? "focus:bg-slate-900" : "hidden"}
          >
            <X className="h-4 w-4 text-muted-foreground" />
            {t("table.reject")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              setSelectedAction("suspend");
              void onStatusChange?.(dealer.id, "Suspended");
              setSuspendOpen(true);
            }}
            className={canChangeStatus ? "focus:bg-slate-900" : "hidden"}
          >
            <PauseCircle className="h-4 w-4 text-danger" />
            {t("table.suspend")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              setSelectedAction("view");
              setViewOpen(true);
            }}
            className="focus:bg-slate-900"
          >
            <Eye className="h-4 w-4 text-muted-foreground" />
            {t("table.view")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={suspendOpen} onOpenChange={setSuspendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("table.suspendDealer")}</DialogTitle>
            <DialogDescription>
              {t("table.suspendDescription")}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("table.suspendPrompt").replace("{name}", dealer.name)}
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSuspendOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" onClick={() => setSuspendOpen(false)}>
              {t("table.suspend")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{dealer.name}</DialogTitle>
            <DialogDescription>{t("table.dealerDetail")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Info
              label={t("table.farmersLinkedLabel")}
              value={String(dealer.farmersLinked)}
            />
            <Info label={t("table.owner")} value={dealer.ownerName} />
            <Info label={t("table.mobileNumber")} value={dealer.mobile} />
            <Info
              label={t("table.location")}
              value={`${dealer.village}, ${dealer.mandal}, ${dealer.district}`}
            />
            <Info label={t("table.joinedLabel")} value={dealer.joined} />
            <Info
              label={t("table.subscriptionStatus")}
              value={
                dealer.subscriptionStatus === "active"
                  ? t("table.active")
                  : t("table.inactive")
              }
            />
            <Info
              label={t("table.subscriptionExpiry")}
              value={formatDate(dealer.subscriptionExpiresAt)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-normal">{value}</p>
    </div>
  );
}
