import type { DealerStatus, FarmerStatus, Priority } from "@/types";
import { Badge } from "@/components/ui/badge";

export function FarmerStatusBadge({ status, blacklisted }: { status: FarmerStatus; blacklisted?: boolean }) {
  const variant = status === "GREEN" ? "green" : status === "YELLOW" ? "yellow" : "red";
  return (
    <div className="flex flex-col items-start gap-1.5 whitespace-nowrap">
      <Badge className="w-24 justify-center" variant={variant}>{status}</Badge>
      {blacklisted ? <Badge className="w-24 justify-center" variant="blacklisted">BLACKLISTED</Badge> : null}
    </div>
  );
}

export function DealerStatusBadge({ status }: { status: DealerStatus }) {
  const variant = status === "Approved" ? "green" : status === "Pending" ? "yellow" : status === "Suspended" ? "red" : "muted";
  return <Badge className="w-24 justify-center" variant={variant}>{status}</Badge>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const variant = priority === "Critical" || priority === "High" ? "red" : priority === "Medium" ? "yellow" : "blue";
  return <Badge className="w-24 justify-center" variant={variant}>{priority}</Badge>;
}
