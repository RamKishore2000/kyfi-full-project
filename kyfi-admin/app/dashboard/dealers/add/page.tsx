"use client";

import { DealerAddForm } from "@/components/dealers/dealer-add-form";
import { PageHeader } from "@/components/navigation/page-header";
import { useAdminLanguage } from "@/components/admin-language-provider";

export default function AddDealerPage() {
  const { t } = useAdminLanguage();

  return (
    <>
      <PageHeader title={t("dealers.addTitle")} description={t("dealers.addDescription")} />
      <div className="mt-6">
        <DealerAddForm />
      </div>
    </>
  );
}
