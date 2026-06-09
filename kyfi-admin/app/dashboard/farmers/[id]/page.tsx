import { notFound } from "next/navigation";
import { farmers } from "@/data/mock-data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type FarmerDetailPageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return farmers.map((farmer) => ({ id: farmer.id }));
}

export default async function FarmerDetailPage({ params }: FarmerDetailPageProps) {
  const { id } = await params;
  const farmer = farmers.find((item) => item.id === id);
  if (!farmer) notFound();
  const statusVariant =
    farmer.status === "GREEN" ? "green" : farmer.status === "YELLOW" ? "yellow" : "red";

  return (
    <>
      <div className="mb-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="min-w-0">
          <p className="mb-2 inline-flex rounded-full border bg-card px-3 py-1 text-xs font-semibold uppercase leading-none text-primary shadow-sm">
            Andhra Pradesh & Telangana
          </p>
          <h1 className="text-2xl font-semibold tracking-normal text-foreground md:text-3xl">
            {farmer.name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {farmer.id} - {farmer.village}, {farmer.mandal} farmer status record
          </p>
        </div>
      </div>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Verification overview</CardTitle>
            <CardDescription>Status overview for the selected farmer.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Info
              label="Status"
              value={
                <Badge className="w-24 justify-center" variant={statusVariant}>
                  {farmer.status}
                </Badge>
              }
            />
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
