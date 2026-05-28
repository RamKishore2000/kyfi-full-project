import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";

export function ErrorState({ message }: { message: string }) {
  return (
    <Card className="border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5" />
        <p className="text-sm font-normal">{message}</p>
      </div>
    </Card>
  );
}
