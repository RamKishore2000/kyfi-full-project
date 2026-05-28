import { Alert } from "@/components/ui/alert";

export function BlacklistWarning() {
  return (
    <Alert variant="destructive" className="border-red-200 bg-red-50">
      <div className="space-y-1">
        <p className="font-manrope type-nav text-red-950">
          BLACKLISTED: This farmer has been reported by one or more dealers for confirmed unpaid dues.
        </p>
        <p className="font-manrope type-body text-red-900/80">
          Blacklist is separate from GREEN, YELLOW, and RED status. A farmer can be GREEN and still show a BLACKLISTED warning.
        </p>
      </div>
    </Alert>
  );
}
