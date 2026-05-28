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
  return (
    <div
      role="alert"
      className={cn(
        "flex gap-3 rounded-2xl border p-4",
        variant === "destructive"
          ? "border-red-200 bg-red-50 text-red-950"
          : "border-emerald-200 bg-emerald-50 text-emerald-950",
        className,
      )}
      {...props}
    >
      <div className="mt-0.5">
        <AlertTriangle className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 font-manrope type-body">{children}</div>
    </div>
  );
}

export { Alert };
