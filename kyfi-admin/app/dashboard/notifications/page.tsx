import { Bell, CheckCheck } from "lucide-react";
import { notifications } from "@/data/mock-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/navigation/page-header";
import { PriorityBadge } from "@/components/tables/status-badge";

export default function NotificationsPage() {
  return (
    <>
      <PageHeader
        title="Notifications"
        description="Operational alerts, escalation notices, dealer approvals, and report updates."
        actions={<Button variant="outline"><CheckCheck className="h-4 w-4" />Mark all read</Button>}
      />
      <Card>
        <CardHeader><CardTitle>Alert inbox</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {notifications.map((item) => (
            <div key={item.id} className={`flex items-start justify-between gap-4 rounded-lg border p-4 ${item.read ? "" : "bg-blue-50/70 dark:bg-blue-950/30"}`}>
              <div className="flex gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-normal">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{item.time}</p>
                </div>
              </div>
              <PriorityBadge priority={item.priority} />
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
