type SubscriptionErrorPayload = {
  code?: string;
  message?: string;
};

export function handleSubscriptionExpiry(payload: unknown) {
  if (typeof window === "undefined") {
    return;
  }

  const error = payload as SubscriptionErrorPayload | null;
  if (error?.code !== "SUBSCRIPTION_EXPIRED") {
    return;
  }

  const dealer = window.localStorage.getItem("kyfi_dealer");
  if (dealer) {
    window.localStorage.setItem("kyfi_pending_dealer", dealer);
  }

  window.localStorage.removeItem("kyfi_token");
  window.localStorage.removeItem("kyfi_dealer");
  window.dispatchEvent(new Event("kyfi-auth-changed"));
  window.location.assign("/register?step=subscription");
}
