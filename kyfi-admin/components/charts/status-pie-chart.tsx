"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { statusDistribution } from "@/data/mock-data";
import { useAdminLanguage } from "@/components/admin-language-provider";

type StatusDistributionItem = {
  name: string;
  value: number;
  color: string;
};

export function StatusPieChart({ data = statusDistribution }: { data?: StatusDistributionItem[] }) {
  const { t } = useAdminLanguage();
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={4}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2 whitespace-nowrap">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
            <span className="text-muted-foreground">
              {item.name === "Green" ? t("badges.green") : item.name === "Yellow" ? t("badges.yellow") : item.name === "Red" ? t("badges.red") : item.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
