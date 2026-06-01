"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminLanguage } from "@/components/admin-language-provider";

export function Pagination({
  page = 1,
  total = 6,
  pageSize = 6,
  onPrev,
  onNext,
}: {
  page?: number;
  total?: number;
  pageSize?: number;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const { t } = useAdminLanguage();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
      <span>
        {t("pagination.page").replace("{page}", String(page)).replace("{total}", String(totalPages))}
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onPrev} disabled={!canGoPrev}>
          <ChevronLeft className="h-4 w-4" />
          {t("pagination.prev")}
        </Button>
        <Button variant="outline" size="sm" onClick={onNext} disabled={!canGoNext}>
          {t("pagination.next")}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
