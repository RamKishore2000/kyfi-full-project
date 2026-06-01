"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Dealer } from "@/types";
import { useAdminLanguage } from "@/components/admin-language-provider";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/navigation/page-header";
import { DealerTable } from "@/components/tables/dealer-table";
import { fetchDealers, updateDealerStatus } from "@/lib/api/dealers";

const statusMap: Record<string, Dealer["status"]> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  suspended: "Suspended",
};

function mapDealerRecord(dealer: {
  id: number;
  name: string;
  mobile: string;
  district: string;
  state: string;
  mandal: string;
  village: string;
  aadhaarOrGstNumber: string;
  status: string;
  createdAt?: string;
}): Dealer {
  return {
    id: `DLR-${String(dealer.id).padStart(4, "0")}`,
    name: dealer.name,
    ownerName: dealer.name,
    mobile: dealer.mobile,
    district: dealer.district,
    mandal: dealer.mandal,
    village: dealer.village,
    licenseId: dealer.aadhaarOrGstNumber,
    aadhaarOrGst: dealer.aadhaarOrGstNumber,
    status: statusMap[dealer.status] ?? "Pending",
    farmersLinked: 0,
    joined: dealer.createdAt
      ? new Date(dealer.createdAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
  };
}

export default function DealersPage() {
  const { t } = useAdminLanguage();
  const [dealerRecords, setDealerRecords] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    fetchDealers()
      .then((response) => {
        if (mounted) {
          setDealerRecords(response.dealers.map(mapDealerRecord));
        }
      })
      .catch((fetchError) => {
        if (mounted) {
          setError(fetchError instanceof Error ? fetchError.message : t("dealers.failed"));
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [t]);

  async function handleStatusChange(dealerId: string, nextStatus: Dealer["status"]) {
    setError("");

    const numericDealerId = Number(dealerId.replace(/^DLR-/, ""));

    if (!Number.isFinite(numericDealerId)) {
      setError(t("dealers.invalidId"));
      return;
    }

    const apiStatus =
      nextStatus === "Approved"
        ? "approved"
        : nextStatus === "Rejected"
          ? "rejected"
          : "suspended";

    try {
      await updateDealerStatus(numericDealerId, apiStatus);
      setDealerRecords((current) =>
        current.map((dealer) =>
          dealer.id === dealerId ? { ...dealer, status: nextStatus } : dealer,
        ),
      );
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : t("dealers.failedUpdate"));
    }
  }

  return (
    <>
      <PageHeader
        title={t("dealers.title")}
        description={t("dealers.description")}
        actions={
          <Button asChild>
            <Link href="/dashboard/dealers/add">{t("dealers.add")}</Link>
          </Button>
        }
      />

      {loading ? (
        <div className="mt-6 rounded-2xl border bg-card p-8 text-sm text-muted-foreground">
          {t("dealers.loading")}
        </div>
      ) : error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-8 text-sm text-red-700">
          {error}
        </div>
      ) : (
        <div className="mt-6">
          <DealerTable dealerRecords={dealerRecords} onStatusChange={handleStatusChange} />
        </div>
      )}
    </>
  );
}
