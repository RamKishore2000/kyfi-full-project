"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
    <Card className="h-full bg-white transition group-hover:border-primary/20">
      <CardContent className="space-y-4 p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="space-y-2">
          <h3 className="font-manrope type-card text-slate-900">
            {title}
          </h3>
          <p className="font-manrope type-body">{description}</p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      whileHover={{ y: -6, scale: 1.01 }}
    >
      {href ? (
        <Link href={href as any} className="group block h-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2">
          {content}
        </Link>
      ) : (
        <div className="h-full">{content}</div>
      )}
    </motion.div>
  );
}
