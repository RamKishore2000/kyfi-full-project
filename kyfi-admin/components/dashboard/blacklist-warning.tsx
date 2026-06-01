import { AlertTriangle } from "lucide-react";
import type { Farmer } from "@/types";
import { useAdminLanguage } from "@/components/admin-language-provider";

export function BlacklistWarning({ farmer }: { farmer: Farmer }) {
  const { t } = useAdminLanguage();
  if (!farmer.blacklisted) return null;

  return (
    <div className="rounded-lg border border-red-950 bg-blacklist p-4 text-white shadow-soft">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-medium">{t("blacklist.reviewTitle")}</p>
          <p className="mt-1 text-sm text-red-100">
            {t("blacklist.warningBody").replace("{name}", farmer.name).replace("{status}", farmer.status)}
          </p>
        </div>
      </div>
    </div>
  );
}
