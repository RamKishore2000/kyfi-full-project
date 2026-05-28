import { Download } from "lucide-react";
import { analytics, farmers } from "@/data/mock-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityAreaChart } from "@/components/charts/activity-area-chart";
import { StatusPieChart } from "@/components/charts/status-pie-chart";
import { MetricCard } from "@/components/cards/metric-card";
import { BlacklistWarning } from "@/components/dashboard/blacklist-warning";
import { PageHeader } from "@/components/navigation/page-header";
import { FarmerTable } from "@/components/tables/farmer-table";

export default function DashboardPage() {
  const greenBlacklisted = farmers.find((farmer) => farmer.status === "GREEN" && farmer.blacklisted)!;

  return (
    <div>
      <PageHeader
        title="Dashboard analytics"
        description="Admin view of dealer approvals, farmer status totals, votes, and separate blacklist entries."
        actions={<Button variant="outline"><Download className="h-4 w-4" />Export</Button>}
      />
      <BlacklistWarning farmer={greenBlacklisted} />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {analytics.map((item) => <MetricCard key={item.label} {...item} />)}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Monthly activity</CardTitle>
            <CardDescription>Farmer onboarding and report volume trend.</CardDescription>
          </CardHeader>
          <CardContent><ActivityAreaChart /></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Status distribution</CardTitle>
            <CardDescription>GREEN / YELLOW / RED farmer status database.</CardDescription>
          </CardHeader>
          <CardContent><StatusPieChart /></CardContent>
        </Card>
      </div>
      <div className="mt-6">
        <div>
          <h2 className="mb-3 text-lg font-medium">Recent farmer records</h2>
          <FarmerTable />
        </div>
      </div>
    </div>
  );
}
