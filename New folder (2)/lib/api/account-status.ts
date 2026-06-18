export type DealerAccountBlockCode =
  | "DEALER_PENDING"
  | "DEALER_REJECTED"
  | "DEALER_SUSPENDED"
  | "DEALER_NOT_APPROVED";

type AccountStatusPayload = {
  code?: string;
  message?: string;
};

const BLOCKED_DEALER_CODES = new Set<string>([
  "DEALER_PENDING",
  "DEALER_REJECTED",
  "DEALER_SUSPENDED",
  "DEALER_NOT_APPROVED",
]);

export const KYFI_ACCOUNT_BLOCKED_EVENT = "kyfi-account-blocked";

export function handleDealerAccountBlock(payload: unknown) {
  if (typeof window === "undefined") {
    return;
  }

  const error = payload as AccountStatusPayload | null;
  if (!error?.code || !BLOCKED_DEALER_CODES.has(error.code)) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(KYFI_ACCOUNT_BLOCKED_EVENT, {
      detail: {
        code: error.code,
        message: error.message || "Your dealer account cannot access KYFI right now.",
      },
    }),
  );
}
