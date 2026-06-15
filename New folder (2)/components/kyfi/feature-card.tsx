"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function FeatureCard({
  icon,
  title,
  mobileTitle,
  mobileDescription,
  description,
  descriptionContent,
  index,
  href,
}: {
  icon: ReactNode;
  title: string;
  mobileTitle?: string;
  mobileDescription?: string;
  description: string;
  descriptionContent?: ReactNode;
  index: number;
  href?: string;
}) {
  const content = (
    <Card className="kyfi-feature-card group flex h-[7.75rem] overflow-hidden border-white/80 bg-white/85 shadow-[0_16px_50px_rgba(15,23,42,0.08)] transition-colors hover:border-emerald-200 sm:h-full">
      <CardContent className="kyfi-feature-card-content flex h-full flex-1 flex-col justify-between gap-4 p-4 sm:gap-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="kyfi-feature-card-icon flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-100 sm:h-12 sm:w-12">
            {icon}
          </div>
          <ArrowUpRight className="kyfi-feature-card-arrow h-4 w-4 text-slate-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-emerald-700" />
        </div>

        <div className="space-y-2">
          <h3 className="kyfi-feature-card-title font-manrope text-[0.98rem] font-bold tracking-[-0.02em] text-slate-900 sm:text-[1.08rem] lg:text-[1.2rem]">
            {mobileTitle ? (
              <>
                <span className="sm:hidden">{mobileTitle}</span>
                <span className="hidden sm:inline">{title}</span>
              </>
            ) : (
              title
            )}
          </h3>
          {mobileDescription ? (
            <p className="kyfi-feature-card-mobile-text font-manrope text-[0.72rem] font-semibold leading-4 text-slate-500 sm:hidden">
              {mobileDescription}
            </p>
          ) : null}
          {descriptionContent ? (
            <div className="hidden sm:block">{descriptionContent}</div>
          ) : (
            <p className="hidden font-manrope text-[0.88rem] leading-6 text-slate-600 sm:block sm:text-[0.95rem] sm:leading-7">
              {description}
            </p>
          )}
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
