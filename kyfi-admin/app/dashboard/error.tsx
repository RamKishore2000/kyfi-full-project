"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/cards/error-state";
import { useAdminLanguage } from "@/components/admin-language-provider";

export default function Error({ reset }: { reset: () => void }) {
  const { t } = useAdminLanguage();

  return (
    <div className="space-y-4">
      <ErrorState message={t("auth.somethingWentWrong")} />
      <Button onClick={reset}>{t("auth.tryAgain")}</Button>
    </div>
  );
}
