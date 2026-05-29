"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import type { Dealer } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
}) : Dealer {
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
  const [dealerRecords, setDealerRecords] = useState<Dealer[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [status, setStatus] = useState<Dealer["status"]>("Pending");
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
          setError(fetchError instanceof Error ? fetchError.message : "Failed to load dealers");
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
  }, []);

  async function handleStatusChange(dealerId: string, nextStatus: Dealer["status"]) {
    setError("");

    const numericDealerId = Number(dealerId.replace(/^DLR-/, ""));

    if (!Number.isFinite(numericDealerId)) {
      setError("Invalid dealer id");
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
      setError(updateError instanceof Error ? updateError.message : "Failed to update dealer");
    }
  }

  function addDealer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const ownerName = String(formData.get("ownerName") ?? "").trim();
    const mobile = String(formData.get("mobile") ?? "").trim();
    const district = String(formData.get("district") ?? "").trim();
    const mandal = String(formData.get("mandal") ?? "").trim();
    const village = String(formData.get("village") ?? "").trim();
    const licenseId = String(formData.get("licenseId") ?? "").trim();
    const aadhaarOrGst = String(formData.get("aadhaarOrGst") ?? "").trim();
    const farmersLinked = Number(formData.get("farmersLinked") ?? 0);

    if (!name || !ownerName || !mobile || !district || !mandal || !village || !licenseId || !aadhaarOrGst) return;

    const nextDealer: Dealer = {
      id: `DLR-${Date.now().toString().slice(-5)}`,
      name,
      ownerName,
      mobile,
      district,
      mandal,
      village,
      licenseId,
      aadhaarOrGst,
      status,
      farmersLinked: Number.isFinite(farmersLinked) ? farmersLinked : 0,
      joined: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    };

    setDealerRecords((current) => [nextDealer, ...current]);
    setDialogOpen(false);
    event.currentTarget.reset();
    setStatus("Pending");
  }

  return (
    <>
      <PageHeader
        title="Dealer management"
        description="Review dealer profiles, approve or reject onboarding, and suspend suspicious accounts."
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" />
                Add dealer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Add dealer</DialogTitle>
                <DialogDescription>Create a new dealer record for review.</DialogDescription>
              </DialogHeader>
              <form className="grid gap-4" onSubmit={addDealer}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-2 text-sm">
                    Dealer name
                    <Input name="name" required placeholder="Coastal Agri Traders" />
                  </label>
                  <label className="space-y-2 text-sm">
                    Owner name
                    <Input name="ownerName" required placeholder="Owner full name" />
                  </label>
                  <label className="space-y-2 text-sm">
                    Mobile number
                    <Input name="mobile" required placeholder="+91 98765 45001" />
                  </label>
                  <label className="space-y-2 text-sm">
                    District
                    <Input name="district" required placeholder="Guntur" />
                  </label>
                  <label className="space-y-2 text-sm">
                    Mandal
                    <Input name="mandal" required placeholder="Tenali" />
                  </label>
                  <label className="space-y-2 text-sm">
                    Village
                    <Input name="village" required placeholder="Kollipara" />
                  </label>
                  <label className="space-y-2 text-sm">
                    License ID
                    <Input name="licenseId" required placeholder="AP-AGR-0000" />
                  </label>
                  <label className="space-y-2 text-sm">
                    Aadhaar / GST
                    <Input name="aadhaarOrGst" required placeholder="GST-0000" />
                  </label>
                  <label className="space-y-2 text-sm">
                    Status
                    <Select value={status} onValueChange={(value) => setStatus(value as Dealer["status"])}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="Suspended">Suspended</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </label>
                  <label className="space-y-2 text-sm">
                    Farmers linked
                    <Input name="farmersLinked" type="number" min="0" defaultValue="0" />
                  </label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add dealer</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {loading ? (
        <div className="rounded-2xl border bg-card p-8 text-sm text-muted-foreground">
          Loading dealers...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-sm text-red-700">
          {error}
        </div>
      ) : (
        <DealerTable dealerRecords={dealerRecords} onStatusChange={handleStatusChange} />
      )}
    </>
  );
}
