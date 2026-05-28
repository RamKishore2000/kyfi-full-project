"use client";

import { FormEvent, useState } from "react";
import { Plus } from "lucide-react";
import { dealers } from "@/data/mock-data";
import type { Dealer } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/navigation/page-header";
import { DealerTable } from "@/components/tables/dealer-table";

export default function DealersPage() {
  const [dealerRecords, setDealerRecords] = useState<Dealer[]>(dealers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [status, setStatus] = useState<Dealer["status"]>("Pending");

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
              <Button><Plus className="h-4 w-4" />Add dealer</Button>
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
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
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
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit">Add dealer</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <DealerTable dealerRecords={dealerRecords} />
    </>
  );
}
