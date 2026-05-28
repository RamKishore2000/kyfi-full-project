import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export function TableShell({ children }: { children: ReactNode }) {
  return <Card className="overflow-hidden">{children}</Card>;
}

export function TableToolbar({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-3 border-b bg-card p-4 md:flex-row md:items-center md:justify-between">{children}</div>;
}
