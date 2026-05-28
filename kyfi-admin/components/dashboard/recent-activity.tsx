import { recentActivity } from "@/data/mock-data";

export function RecentActivity() {
  return (
    <div className="space-y-4">
      {recentActivity.map((item, index) => (
        <div key={item} className="flex gap-3">
          <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-medium text-primary dark:bg-blue-950">
            {index + 1}
          </span>
          <div>
            <p className="text-sm font-normal">{item}</p>
            <p className="text-xs text-muted-foreground">{index + 1}h ago</p>
          </div>
        </div>
      ))}
    </div>
  );
}
