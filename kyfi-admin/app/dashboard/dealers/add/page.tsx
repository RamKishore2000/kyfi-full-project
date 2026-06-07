"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DealerAddForm } from "@/components/dealers/dealer-add-form";
import { PageHeader } from "@/components/navigation/page-header";
import { useAdminLanguage } from "@/components/admin-language-provider";
import { Button } from "@/components/ui/button";
import { hasAdminPermission } from "@/lib/admin-permissions";

export default function AddDealerPage() {
  const { t } = useAdminLanguage();
  const [canAddDealers, setCanAddDealers] = useState(false);

  useEffect(() => {
    setCanAddDealers(hasAdminPermission("dealers.add"));
  }, []);

  return (
    <>
      <PageHeader
        title={t("dealers.addTitle")}
        description={t("dealers.addDescription")}
        actions={
          <Button asChild variant="outline">
            <Link href="/dashboard/dealers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />
      <div className="mt-6">
        {canAddDealers ? (
          <DealerAddForm />
        ) : (
          <div className="rounded-2xl border bg-card p-8 text-sm text-muted-foreground">
            Permission denied. You do not have access to add dealers.
          </div>
        )}
      </div>
    </>
  );
}
