"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const statusStyles = {
  GREEN:
    "border-emerald-200/90 bg-gradient-to-br from-emerald-50 via-emerald-50 to-white",
  YELLOW:
    "border-amber-200/90 bg-gradient-to-br from-amber-50 via-amber-50 to-white",
  RED: "border-red-200/90 bg-gradient-to-br from-red-50 via-red-50 to-white",
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
    status === "GREEN"
      ? "success"
      : status === "YELLOW"
        ? "warning"
        : "destructive";

  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      whileHover={{ y: -4 }}
    >
      <Card
        className={cn(
          "kyfi-status-card h-full border shadow-[0_16px_50px_rgba(15,23,42,0.08)] max-sm:rounded-[1rem] max-sm:shadow-[0_8px_20px_rgba(15,23,42,0.05)]",
          statusStyles[status],
        )}
      >
        <CardContent className="kyfi-status-card-content space-y-5 p-6 max-sm:flex max-sm:h-[5.5rem] max-sm:flex-col max-sm:items-center max-sm:justify-center max-sm:space-y-1 max-sm:px-2 max-sm:py-2 max-sm:text-center">
          <div className="flex items-center justify-between gap-3 max-sm:justify-center max-sm:gap-0">
            <Badge
              variant={badgeVariant}
              className="kyfi-status-badge max-sm:rounded-full max-sm:px-2.5 max-sm:py-1 max-sm:text-[0.58rem] max-sm:tracking-[0.08em]"
            >
              {status}
            </Badge>
            <span
              className={cn(
                "text-xs font-bold uppercase tracking-[0.18em] max-sm:hidden",
                status === "GREEN"
                  ? "text-emerald-700"
                  : status === "YELLOW"
                    ? "text-amber-700"
                    : "text-red-700",
              )}
            >
              Reputation signal
            </span>
          </div>
          <div className="space-y-2 max-sm:space-y-0">
            <h3
              className={cn(
                "kyfi-status-title font-manrope text-[1.08rem] font-bold tracking-[-0.02em] lg:text-[1.15rem] max-sm:text-[0.7rem] max-sm:font-extrabold max-sm:leading-tight",
                status === "GREEN"
                  ? "text-emerald-900"
                  : status === "YELLOW"
                    ? "text-amber-900"
                    : "text-red-900",
              )}
            >
              {title}
            </h3>
            <p
              className={cn(
                "kyfi-status-text hidden font-manrope text-[0.95rem] leading-7 sm:block",
                status === "GREEN"
                  ? "text-emerald-900/70"
                  : status === "YELLOW"
                    ? "text-amber-900/70"
                    : "text-red-900/70",
              )}
            >
              {text}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
