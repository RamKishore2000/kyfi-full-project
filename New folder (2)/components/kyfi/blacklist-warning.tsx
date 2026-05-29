import { Alert } from "@/components/ui/alert";

export function BlacklistWarning() {
  return (
    <Alert variant="destructive" className="border-red-200 bg-gradient-to-br from-red-50 to-white shadow-[0_14px_40px_rgba(239,68,68,0.08)]">
      <div className="space-y-1">
        <p className="font-manrope text-sm font-bold tracking-[-0.01em] text-red-950">
          BLACKLISTED: This farmer has been reported by one or more dealers for confirmed unpaid dues.
        </p>
        <p className="font-manrope text-sm leading-7 text-red-900/80">
          Blacklist is separate from GREEN, YELLOW, and RED status. A farmer can be GREEN and still show a BLACKLISTED warning.
        </p>
      </div>
    </Alert>
  );
}
