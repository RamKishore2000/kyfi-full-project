"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const statusStyles = {
  GREEN: "border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white",
  YELLOW: "border-amber-200/80 bg-gradient-to-br from-amber-50 to-white",
  RED: "border-red-200/80 bg-gradient-to-br from-red-50 to-white",
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
      <Card className={cn("h-full border shadow-[0_16px_50px_rgba(15,23,42,0.08)]", statusStyles[status])}>
        <CardContent className="space-y-5 p-6">
          <div className="flex items-center justify-between gap-3">
            <Badge variant={badgeVariant}>{status}</Badge>
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              Reputation signal
            </span>
          </div>
          <div className="space-y-2">
            <h3 className="font-manrope text-[1.08rem] font-bold tracking-[-0.02em] text-slate-900 lg:text-[1.15rem]">
              {title}
            </h3>
            <p className="font-manrope text-[0.95rem] leading-7 text-slate-600">{text}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
