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
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      whileHover={{ y: -4 }}
    >
      <Card
        className={cn(
          "h-full border shadow-[0_16px_50px_rgba(15,23,42,0.08)] max-sm:shadow-[0_10px_24px_rgba(15,23,42,0.06)]",
          statusStyles[status],
        )}
      >
        <CardContent className="space-y-5 p-6 max-sm:space-y-1.5 max-sm:px-2.5 max-sm:py-2.5">
          <div className="flex items-center justify-between gap-3 max-sm:gap-2">
            <Badge
              variant={badgeVariant}
              className="max-sm:px-2 max-sm:py-0.5 max-sm:text-[0.62rem]"
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
          <div className="space-y-2 max-sm:space-y-0.5">
            <h3
              className={cn(
                "font-manrope text-[1.08rem] font-bold tracking-[-0.02em] lg:text-[1.15rem] max-sm:text-[0.72rem]",
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
                "hidden font-manrope text-[0.95rem] leading-7 sm:block",
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
