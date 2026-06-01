import type { DealerStatus, FarmerStatus, Priority } from "@/types";
import { Badge } from "@/components/ui/badge";
import { useAdminLanguage } from "@/components/admin-language-provider";

export function FarmerStatusBadge({
  status,
  blacklisted,
  showStatusBadge = true,
}: {
  status: FarmerStatus;
  blacklisted?: boolean;
  showStatusBadge?: boolean;
}) {
  const { t } = useAdminLanguage();
  const normalizedStatus = String(status).toUpperCase();
  const isBlacklistOnly = normalizedStatus === "BLACKLISTED";
  const variant = status === "GREEN" ? "green" : status === "YELLOW" ? "yellow" : "red";
  return (
    <div className="flex flex-col items-start gap-1.5 whitespace-nowrap">
      {showStatusBadge && !isBlacklistOnly ? (
        <Badge className="w-24 justify-center" variant={variant}>
          {t(`badges.${status.toLowerCase()}`)}
        </Badge>
      ) : null}
      {blacklisted ? <Badge className="w-24 justify-center" variant="blacklisted">{t("badges.blacklisted")}</Badge> : null}
    </div>
  );
}

export function DealerStatusBadge({ status }: { status: DealerStatus }) {
  const { t } = useAdminLanguage();
  const variant = status === "Approved" ? "green" : status === "Pending" ? "yellow" : status === "Suspended" ? "red" : "muted";
  return <Badge className="w-24 justify-center" variant={variant}>{t(`table.${status.toLowerCase()}`)}</Badge>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const variant = priority === "Critical" || priority === "High" ? "red" : priority === "Medium" ? "yellow" : "blue";
  return <Badge className="w-24 justify-center" variant={variant}>{priority}</Badge>;
}
