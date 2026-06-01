"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function FeatureCard({
  icon,
  title,
  description,
  index,
  href,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  index: number;
  href?: string;
}) {
  const content = (
    <Card className="group flex h-full overflow-hidden border-white/80 bg-white/85 shadow-[0_16px_50px_rgba(15,23,42,0.08)] transition-colors hover:border-emerald-200">
      <CardContent className="flex h-full flex-1 flex-col justify-between gap-5 p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-100">
            {icon}
          </div>
          <ArrowUpRight className="h-4 w-4 text-slate-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-emerald-700" />
        </div>

        <div className="space-y-2">
          <h3 className="font-manrope text-[1.08rem] font-bold tracking-[-0.02em] text-slate-900 lg:text-[1.2rem]">
            {title}
          </h3>
          <p className="font-manrope text-[0.95rem] leading-7 text-slate-600">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      whileHover={{ y: -6, scale: 1.01 }}
    >
      {href ? (
        <Link
          href={href as any}
          className="group block h-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2"
        >
          {content}
        </Link>
      ) : (
        <div className="h-full">{content}</div>
      )}
    </motion.div>
  );
}
