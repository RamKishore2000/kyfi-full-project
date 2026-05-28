import { AlertTriangle } from "lucide-react";
import type { Farmer } from "@/types";

export function BlacklistWarning({ farmer }: { farmer: Farmer }) {
  if (!farmer.blacklisted) return null;

  return (
    <div className="rounded-lg border border-red-950 bg-blacklist p-4 text-white shadow-soft">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-medium">Blacklist warning dominates this record</p>
          <p className="mt-1 text-sm text-red-100">
            {farmer.name} may still show {farmer.status} verification, but blacklist status takes visual and operational priority.
          </p>
        </div>
      </div>
    </div>
  );
}
