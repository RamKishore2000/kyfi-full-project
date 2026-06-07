"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { farmers } from "@/data/mock-data";
import type { Farmer } from "@/types";
import { useFilter } from "@/hooks/use-filter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SearchFilterBar } from "@/components/forms/search-filter-bar";
import { FarmerStatusBadge } from "@/components/tables/status-badge";
import { Pagination } from "@/components/tables/pagination";
import { TableShell, TableToolbar } from "@/components/tables/table-shell";
import { useAdminLanguage } from "@/components/admin-language-provider";
import { fetchFarmerVotes, type FarmerVoteRecord } from "@/lib/api/farmers";

type FarmerTableMode = "OLD" | "NEW" | "MIXED";

export function FarmerTable({
  farmerRecords = farmers,
  farmerType = "MIXED",
}: { farmerRecords?: Farmer[]; farmerType?: FarmerTableMode } = {}) {
  return (
    <FarmerTableContent farmerRecords={farmerRecords} farmerType={farmerType} />
  );
}

export function FarmerTableContent({
  farmerRecords = farmers,
  farmerType = "MIXED",
}: {
  farmerRecords?: Farmer[];
  farmerType?: FarmerTableMode;
}) {
  const { t } = useAdminLanguage();
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [voteDialogOpen, setVoteDialogOpen] = useState(false);
  const [votesLoading, setVotesLoading] = useState(false);
  const [votesError, setVotesError] = useState("");
  const [selectedFarmerVotes, setSelectedFarmerVotes] = useState<
    FarmerVoteRecord[]
  >([]);
  const [selectedFarmerForVotes, setSelectedFarmerForVotes] =
    useState<Farmer | null>(null);
  const [dealerStatusDialogOpen, setDealerStatusDialogOpen] = useState(false);
  const [selectedFarmerForDealerStatuses, setSelectedFarmerForDealerStatuses] =
    useState<Farmer | null>(null);
  const pageSize = 5;
  const isOldMode = farmerType === "OLD";
  const isNewMode = farmerType === "NEW";
  const statusFilteredFarmers = useMemo(() => {
    if (isOldMode || statusFilter === "All") return farmerRecords;
    return farmerRecords.filter(
      (farmer) =>
        String(farmer.status || "").toLowerCase() ===
        statusFilter.toLowerCase(),
    );
  }, [farmerRecords, isOldMode, statusFilter]);
  const { query, setQuery, filtered } = useFilter(statusFilteredFarmers, [
    "name",
    "id",
    "district",
    "mandal",
    "village",
    "aadhaarMasked",
    "phone",
  ]);
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
    [filtered, page],
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

  const openVotesDialog = async (farmer: Farmer) => {
    if (!farmer.statusId) return;

    setSelectedFarmerForVotes(farmer);
    setSelectedFarmerVotes([]);
    setVotesError("");
    setVotesLoading(true);
    setVoteDialogOpen(true);

    try {
      const response = await fetchFarmerVotes(farmer.statusId);
      setSelectedFarmerVotes(response.votes);
    } catch (error) {
      setVotesError(
        error instanceof Error ? error.message : t("table.loading"),
      );
    } finally {
      setVotesLoading(false);
    }
  };
  const openDealerStatusDialog = (farmer: Farmer) => {
    setSelectedFarmerForDealerStatuses(farmer);
    setDealerStatusDialogOpen(true);
  };
  const isOldFarmer = (farmer: Farmer) =>
    String(farmer.farmerType || farmerType || "").toUpperCase() === "OLD";
  const isNewFarmer = (farmer: Farmer) =>
    String(farmer.farmerType || farmerType || "").toUpperCase() === "NEW";

  return (
    <TableShell>
      <TableToolbar>
        <div className="w-full space-y-3">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {isOldMode
                ? "Old Farmers"
                : isNewMode
                  ? "New Farmers"
                  : "Farmer Records"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isOldMode
                ? "Public old farmer records with dealer vote counts."
                : isNewMode
                  ? "Dealer-created new farmer records grouped by Aadhaar."
                  : "Recent farmer records from the database."}
            </p>
          </div>
          <div className="w-full [&>div]:w-full [&>div]:md:grid-cols-[minmax(0,1fr)_270px]">
            <SearchFilterBar
              value={query}
              onChange={setQuery}
              placeholder={t("table.searchFarmer")}
              selectedFilter={statusFilter}
              onFilterChange={setStatusFilter}
              filters={isOldMode ? ["All"] : undefined}
              showFiltersButton={false}
            />
          </div>
        </div>
      </TableToolbar>
      <div className="space-y-3 md:hidden">
        {paginatedFarmers.map((farmer) => (
          <div key={farmer.id} className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium leading-5">{farmer.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {farmer.id}
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 text-sm">
              <Info
                label={t("table.location")}
                value={`${farmer.village}, ${farmer.mandal}, ${farmer.district}`}
              />
              <Info
                label={t("table.aadhaarMobile")}
                value={`${farmer.aadhaarMasked} / ${farmer.phone}`}
              />
              {isNewFarmer(farmer) ? (
                <Info
                  label="Dealers added"
                  value={String(
                    farmer.dealerCount || farmer.dealerStatuses?.length || 0,
                  )}
                />
              ) : null}
              {!isNewFarmer(farmer) ? (
                <div className="rounded-md border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {t("table.votes")}
                      </p>
                      <p className="mt-1 font-semibold">
                        {String(farmer.voteCount)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="px-3"
                      disabled={!farmer.statusId}
                      onClick={() => void openVotesDialog(farmer)}
                    >
                      <Eye className="h-4 w-4" />
                      View Votes
                    </Button>
                  </div>
                </div>
              ) : null}
              {isNewFarmer(farmer) ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="justify-center"
                  onClick={() => openDealerStatusDialog(farmer)}
                >
                  <Eye className="h-4 w-4" />
                  View dealer statuses
                </Button>
              ) : null}
              {!isOldFarmer(farmer) && !isNewMode ? (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t("table.status")}
                    </p>
                    <div className="mt-2">
                      <FarmerStatusBadge status={farmer.status} />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
      <div className="hidden overflow-hidden md:block">
        <table className="w-full table-fixed text-left text-sm leading-6">
          <colgroup>
            <col className={isNewMode ? "w-[20%]" : "w-[24%]"} />
            <col className={isNewMode ? "w-[20%]" : "w-[24%]"} />
            <col className={isNewMode ? "w-[18%]" : "w-[20%]"} />
            {isOldMode ? (
              <>
                <col className="w-[20%]" />
                <col className="w-[12%]" />
              </>
            ) : isNewMode ? (
              <>
                <col className="w-[14%]" />
                <col className="w-[28%]" />
              </>
            ) : (
              <>
                <col className="w-[14%]" />
                <col className="w-[10%]" />
                <col className="w-[8%]" />
              </>
            )}
          </colgroup>
          <thead className="bg-muted/60 text-xs font-semibold uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">{t("table.farmer")}</th>
              <th className="px-4 py-3">{t("table.location")}</th>
              <th className="px-4 py-3">{t("table.aadhaarMobile")}</th>
              {isOldMode ? (
                <>
                  <th className="px-4 py-3">{t("table.votes")}</th>
                  <th className="px-4 py-3 text-right">View Votes</th>
                </>
              ) : isNewMode ? (
                <>
                  <th className="px-4 py-3">Dealers added</th>
                  <th className="px-4 py-3 text-right">Dealer statuses</th>
                </>
              ) : (
                <>
                  <th className="px-4 py-3 text-center">{t("table.status")}</th>
                  <th className="px-4 py-3">{t("table.votes")}</th>
                  <th className="px-4 py-3 text-right">{t("table.actions")}</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y">
            {paginatedFarmers.map((farmer) => (
              <tr key={farmer.id} className="hover:bg-muted/40">
                <td className="px-4 py-4 align-middle">
                  <div className="truncate font-medium leading-5">
                    {farmer.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {farmer.id}
                  </div>
                </td>
                <td className="px-4 py-4 align-middle">
                  <div>{farmer.village}</div>
                  <div className="text-xs text-muted-foreground">
                    {farmer.mandal}, {farmer.district}
                  </div>
                </td>
                <td className="px-4 py-4 align-middle">
                  <div className="tabular-nums">{farmer.aadhaarMasked}</div>
                  <div className="text-xs text-muted-foreground">
                    {farmer.phone}
                  </div>
                </td>
                {isOldMode ? (
                  <>
                    <td className="px-4 py-4 align-middle">
                      <span className="tabular-nums font-medium">
                        {farmer.voteCount}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 px-3"
                          disabled={!farmer.statusId}
                          onClick={() => void openVotesDialog(farmer)}
                        >
                          <Eye className="h-4 w-4" />
                          View Votes
                        </Button>
                      </div>
                    </td>
                  </>
                ) : isNewMode ? (
                  <>
                    <td className="px-4 py-4 align-middle">
                      <span className="tabular-nums font-medium">
                        {farmer.dealerCount ||
                          farmer.dealerStatuses?.length ||
                          0}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 px-3"
                          onClick={() => openDealerStatusDialog(farmer)}
                        >
                          <Eye className="h-4 w-4" />
                          View statuses
                        </Button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-4 align-middle">
                      <div className="flex justify-center">
                        {isOldFarmer(farmer) ? (
                          <span className="text-xs text-muted-foreground">
                            Old Farmer
                          </span>
                        ) : (
                          <FarmerStatusBadge status={farmer.status} />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      {isNewFarmer(farmer) ? (
                        <span className="text-xs text-muted-foreground">
                          Dealer status record
                        </span>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="tabular-nums font-medium">
                            {farmer.voteCount}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 px-3"
                            disabled={!farmer.statusId}
                            onClick={() => void openVotesDialog(farmer)}
                          >
                            <Eye className="h-4 w-4" />
                            View Votes
                          </Button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <div className="flex items-center justify-end" />
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        total={filtered.length}
        pageSize={pageSize}
        page={page}
        onPrev={handlePrev}
        onNext={handleNext}
      />

      <Dialog open={voteDialogOpen} onOpenChange={setVoteDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedFarmerForVotes?.name || "Votes"}</DialogTitle>
            <DialogDescription>
              {selectedFarmerForVotes?.id || ""} {t("table.detailView")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {votesLoading ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                {t("table.loading")}
              </div>
            ) : votesError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {votesError}
              </div>
            ) : selectedFarmerVotes.length ? (
              <div className="space-y-3">
                {selectedFarmerVotes.map((vote) => (
                  <div
                    key={`${vote.statusId}-${vote.dealerId}`}
                    className="rounded-xl border p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {vote.dealerName}
                        </p>
                        <p className="text-sm text-slate-500">
                          Dealer ID: {vote.dealerId}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                      <Info label="Mobile number" value={vote.dealerMobile} />
                      <Info
                        label="Voted date/time"
                        value={new Intl.DateTimeFormat("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(vote.votedAt))}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                No votes found for this farmer.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dealerStatusDialogOpen}
        onOpenChange={setDealerStatusDialogOpen}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedFarmerForDealerStatuses?.name || "Dealer statuses"}
            </DialogTitle>
            <DialogDescription>
              {selectedFarmerForDealerStatuses?.aadhaarMasked || ""} ·{" "}
              {selectedFarmerForDealerStatuses?.phone || ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-3 rounded-2xl border bg-muted/30 p-4 text-sm sm:grid-cols-3">
              <Info
                label="Farmer"
                value={selectedFarmerForDealerStatuses?.name || "-"}
              />
              <Info
                label="Location"
                value={[
                  selectedFarmerForDealerStatuses?.village,
                  selectedFarmerForDealerStatuses?.mandal,
                  selectedFarmerForDealerStatuses?.district,
                ]
                  .filter(Boolean)
                  .join(", ")}
              />
              <Info
                label="Dealers added"
                value={String(
                  selectedFarmerForDealerStatuses?.dealerCount ||
                    selectedFarmerForDealerStatuses?.dealerStatuses?.length ||
                    0,
                )}
              />
            </div>

            {selectedFarmerForDealerStatuses?.dealerStatuses?.length ? (
              <div className="grid gap-3">
                {selectedFarmerForDealerStatuses.dealerStatuses.map((item) => (
                  <div
                    key={`${item.statusId}-${item.dealerId}`}
                    className="rounded-2xl border bg-card p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">
                          {item.dealerName}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Dealer ID: {item.dealerId}
                        </p>
                      </div>
                      <FarmerStatusBadge status={item.status} />
                    </div>
                    <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                      <Info label="Mobile number" value={item.dealerMobile} />
                      <Info
                        label="Shop name"
                        value={item.dealerShopName || "-"}
                      />
                      <Info
                        label="Added date/time"
                        value={new Intl.DateTimeFormat("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(item.addedAt))}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                No dealer status details found for this farmer.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </TableShell>
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

function DealerStatusList({ farmer }: { farmer: Farmer }) {
  const statuses = farmer.dealerStatuses ?? [];

  if (!statuses.length) {
    return (
      <span className="text-xs text-muted-foreground">
        No dealer status details
      </span>
    );
  }

  return (
    <div className="space-y-2">
      {statuses.slice(0, 4).map((item) => (
        <div
          key={`${item.statusId}-${item.dealerId}`}
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-background px-2 py-1.5"
        >
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-foreground">
              {item.dealerName}
            </p>
            <p className="truncate text-[0.68rem] text-muted-foreground">
              ID: {item.dealerId} · {item.dealerMobile}
            </p>
          </div>
          <FarmerStatusBadge status={item.status} />
        </div>
      ))}
      {statuses.length > 4 ? (
        <p className="text-xs text-muted-foreground">
          +{statuses.length - 4} more dealers
        </p>
      ) : null}
    </div>
  );
}
