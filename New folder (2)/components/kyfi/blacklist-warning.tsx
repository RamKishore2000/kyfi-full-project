import { Alert } from "@/components/ui/alert";

export function BlacklistWarning() {
  return (
    <Alert
      variant="destructive"
      className="border-red-200 bg-gradient-to-br from-red-50 via-red-50 to-red-100/60 text-slate-950"
    >
      <div className="space-y-1">
        <p className="font-manrope text-sm font-bold tracking-[-0.01em] text-slate-950">
          BLACKLISTED: This farmer has been reported by one or more dealers for confirmed unpaid dues.
        </p>
        <p className="font-manrope text-sm leading-7 text-slate-800">
          Blacklist is separate from GREEN, YELLOW, and RED status. A farmer can be GREEN and still show a BLACKLISTED warning.
        </p>
      </div>
    </Alert>
  );
}
