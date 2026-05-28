import { ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/navigation/page-header";
import { BlacklistList } from "@/components/tables/blacklist-list";

export default function BlacklistPage() {
  return (
    <>
      <PageHeader
        title="Blacklist management"
        description="High priority review queue for Andhra Pradesh and Telangana farmer records with fraud, safety, or compliance warnings."
      />
      <Card className="mb-6 overflow-hidden border-red-950 bg-blacklist text-white">
        <div className="grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_16rem] md:items-center">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/10">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold leading-tight">Blacklist status overrides visual priority</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-red-100">
                KYFI is scoped only to Andhra Pradesh and Telangana. A farmer can be GREEN and BLACKLISTED at the same time, and blacklist warnings remain dominant.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-xl font-medium leading-none">2</p>
              <p className="mt-1 text-xs font-normal text-red-100">States</p>
            </div>
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-xl font-medium leading-none">AP/TS</p>
              <p className="mt-1 text-xs font-normal text-red-100">Coverage</p>
            </div>
          </div>
        </div>
      </Card>
      <BlacklistList />
    </>
  );
}
