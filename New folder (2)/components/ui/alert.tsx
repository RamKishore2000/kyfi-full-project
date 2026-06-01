import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive";
}

function Alert({
  className,
  variant = "default",
  children,
  ...props
}: AlertProps) {
  const isDestructive = variant === "destructive";

  return (
    <div
      role="alert"
      className={cn(
        "flex gap-3 rounded-2xl border p-4",
        isDestructive
          ? "border-red-200 bg-red-50/90 text-red-950"
          : "border-emerald-200 bg-emerald-50/65 text-slate-600",
        className,
      )}
      {...props}
    >
      <div className="mt-0.5">
        <AlertTriangle
          className={cn("h-4 w-4", isDestructive ? "text-red-900" : "text-emerald-900")}
        />
      </div>
      <div className="min-w-0 flex-1 font-manrope type-body">{children}</div>
    </div>
  );
}

export { Alert };
