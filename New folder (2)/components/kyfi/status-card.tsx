"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const statusStyles = {
  GREEN: "border-emerald-200 bg-emerald-50/80",
  YELLOW: "border-amber-200 bg-amber-50/80",
  RED: "border-red-200 bg-red-50/80",
} as const;

export function StatusCard({
  status,
  title,
  text,
  index,
}: {
  status: "GREEN" | "YELLOW" | "RED";
  title: string;
  text: string;
  index: number;
}) {
  const badgeVariant =
    status === "GREEN" ? "success" : status === "YELLOW" ? "warning" : "destructive";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      whileHover={{ y: -4 }}
    >
      <Card className={cn("h-full border", statusStyles[status])}>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center justify-between gap-3">
            <Badge variant={badgeVariant}>{status}</Badge>
            <span className="font-manrope type-small text-slate-500">
              Repayment status
            </span>
          </div>
          <div className="space-y-2">
            <h3 className="font-manrope type-card text-slate-900">
              {title}
            </h3>
            <p className="font-manrope type-body">{text}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
