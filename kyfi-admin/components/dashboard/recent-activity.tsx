import { useAdminLanguage } from "@/components/admin-language-provider";

export function RecentActivity() {
  const { t } = useAdminLanguage();
  const rows = [
    t("activity.approved").replace("{dealer}", "Telangana Crop Connect").replace("{district}", "Warangal"),
    t("activity.escalated").replace("{district}", "Nizamabad"),
    t("activity.exported"),
    t("activity.reviewed").replace("{count}", "6"),
  ];

  return (
    <div className="space-y-4">
      {rows.map((item, index) => (
        <div key={item} className="flex gap-3">
          <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-medium text-primary dark:bg-emerald-950">
            {index + 1}
          </span>
          <div>
            <p className="text-sm font-normal">{item}</p>
            <p className="text-xs text-muted-foreground">{t("activity.hourAgo").replace("{hours}", String(index + 1))}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
