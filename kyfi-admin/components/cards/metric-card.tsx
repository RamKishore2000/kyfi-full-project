"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";

const tones: Record<string, string> = {
  success: "text-success bg-green-50 dark:bg-green-950",
  primary: "text-primary bg-blue-50 dark:bg-blue-950",
  warning: "text-warning bg-yellow-50 dark:bg-yellow-950",
  danger: "text-danger bg-red-50 dark:bg-red-950",
};

export function MetricCard({ label, value, change, tone }: { label: string; value: number; change: string; tone: string }) {
  return (
    <motion.div className="h-full" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="h-full min-h-36 transition hover:-translate-y-0.5 hover:shadow-lg">
        <CardContent className="flex h-full min-h-36 flex-col justify-between p-5">
          <div className="space-y-4">
            <p className="whitespace-nowrap text-sm font-normal leading-6 text-muted-foreground">{label}</p>
            <div className="flex items-end justify-between gap-3 max-sm:flex-col max-sm:items-start">
              <p className="mt-2 text-3xl font-semibold leading-none tabular-nums">{formatNumber(value)}</p>
              <span className={`inline-flex min-w-0 shrink items-center gap-1 rounded-full px-2 py-1 text-xs font-medium leading-none ${tones[tone]}`}>
                <span className="truncate">{change}</span>
                <ArrowUpRight className="h-3 w-3 shrink-0" />
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
