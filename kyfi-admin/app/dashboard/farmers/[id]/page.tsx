import { notFound } from "next/navigation";
import { farmers } from "@/data/mock-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BlacklistWarning } from "@/components/dashboard/blacklist-warning";
import { PageHeader } from "@/components/navigation/page-header";
import { FarmerStatusBadge } from "@/components/tables/status-badge";

type FarmerDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function FarmerDetailPage({ params }: FarmerDetailPageProps) {
  const { id } = await params;
  const farmer = farmers.find((item) => item.id === id);
  if (!farmer) notFound();

  return (
    <>
      <PageHeader title={farmer.name} description={`${farmer.id} - ${farmer.village}, ${farmer.mandal} farmer status record`} />
      <div className="space-y-6">
        <BlacklistWarning farmer={farmer} />
        <Card>
          <CardHeader>
            <CardTitle>Verification overview</CardTitle>
            <CardDescription>Status is independent from blacklist membership.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Info label="Status" value={<FarmerStatusBadge status={farmer.status} blacklisted={farmer.blacklisted} />} />
            <Info label="Aadhaar" value={farmer.aadhaarMasked} />
            <Info label="Phone" value={farmer.phone} />
            <Info label="Crop" value={farmer.crop} />
            <Info label="Village / Mandal" value={`${farmer.village}, ${farmer.mandal}`} />
            <Info label="Vote count" value={String(farmer.voteCount)} />
            <Info label="Date added" value={farmer.dateAdded} />
            <Info label="Last verified" value={farmer.lastVerified} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Remarks and history</CardTitle>
            <CardDescription>Admin-only review notes and vote/edit activity.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4 text-sm">{farmer.remarks}</div>
            <div className="space-y-2">
              {farmer.history.map((item) => (
                <div key={item} className="rounded-md border p-3 text-sm text-muted-foreground">{item}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-2 font-normal">{value}</div>
    </div>
  );
}
