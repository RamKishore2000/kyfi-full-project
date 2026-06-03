"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DealerAddForm } from "@/components/dealers/dealer-add-form";
import { PageHeader } from "@/components/navigation/page-header";
import { useAdminLanguage } from "@/components/admin-language-provider";
import { Button } from "@/components/ui/button";

export default function AddDealerPage() {
  const { t } = useAdminLanguage();

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
        <DealerAddForm />
      </div>
    </>
  );
}
