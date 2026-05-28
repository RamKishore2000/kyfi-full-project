import { Download } from "lucide-react";
import { districtPerformance } from "@/data/mock-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityAreaChart } from "@/components/charts/activity-area-chart";
import { DistrictBarChart } from "@/components/charts/district-bar-chart";
import { PageHeader } from "@/components/navigation/page-header";

export default function ReportsPage() {
  return (
    <>
      <PageHeader
        title="Reports & analytics"
        description="District, mandal, dealer activity, and recent farmer status or blacklist records."
        actions={<Button variant="outline"><Download className="h-4 w-4" />Download report</Button>}
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Monthly activity</CardTitle><CardDescription>Farmer onboarding and incident reporting.</CardDescription></CardHeader>
          <CardContent><ActivityAreaChart /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>District performance</CardTitle><CardDescription>Farmers and reports by district.</CardDescription></CardHeader>
          <CardContent><DistrictBarChart /></CardContent>
        </Card>
      </div>
      <div className="mt-6">
        <Card>
          <CardHeader><CardTitle>Active districts</CardTitle><CardDescription>Activity score from recent dealer submissions.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {districtPerformance.map((district) => (
              <div key={district.district}>
                <div className="mb-2 flex justify-between text-sm"><span>{district.district}</span><span>{district.score}%</span></div>
                <div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${district.score}%` }} /></div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
