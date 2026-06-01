import { Download } from "lucide-react";
import { districtPerformance } from "@/data/mock-data";
import { useAdminLanguage } from "@/components/admin-language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityAreaChart } from "@/components/charts/activity-area-chart";
import { DistrictBarChart } from "@/components/charts/district-bar-chart";
import { PageHeader } from "@/components/navigation/page-header";

export default function ReportsPage() {
  const { t } = useAdminLanguage();
  return (
    <>
      <PageHeader
        title={t("reports.title")}
        description={t("reports.description")}
        actions={<Button variant="outline"><Download className="h-4 w-4" />{t("reports.download")}</Button>}
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{t("reports.monthlyTitle")}</CardTitle><CardDescription>{t("reports.monthlyDescription")}</CardDescription></CardHeader>
          <CardContent><ActivityAreaChart /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t("reports.districtTitle")}</CardTitle><CardDescription>{t("reports.districtDescription")}</CardDescription></CardHeader>
          <CardContent><DistrictBarChart /></CardContent>
        </Card>
      </div>
      <div className="mt-6">
        <Card>
          <CardHeader><CardTitle>{t("reports.activeTitle")}</CardTitle><CardDescription>{t("reports.activeDescription")}</CardDescription></CardHeader>
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
