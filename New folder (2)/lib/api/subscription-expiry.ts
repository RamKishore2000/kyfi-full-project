type SubscriptionErrorPayload = {
  code?: string;
  message?: string;
};

function clearDealerSession() {
  const dealer = window.localStorage.getItem("kyfi_dealer");
  if (dealer) {
    window.localStorage.setItem("kyfi_pending_dealer", dealer);
  }

  window.localStorage.removeItem("kyfi_token");
  window.localStorage.removeItem("kyfi_dealer");
  window.dispatchEvent(new Event("kyfi-auth-changed"));
}

export function handleTokenExpiry(payload: unknown, status?: number) {
  if (typeof window === "undefined") {
    return;
  }

  const error = payload as SubscriptionErrorPayload | null;
  const message = String(error?.message || "").toLowerCase();
  const isExpiredToken =
    status === 401 &&
    (message.includes("invalid or expired token") ||
      message.includes("authorization token required") ||
      message.includes("invalid token") ||
      message.includes("expired token"));

  if (!isExpiredToken) {
    return;
  }

  clearDealerSession();
  window.location.assign("/login");
}

export function handleSubscriptionExpiry(payload: unknown, status?: number) {
  if (typeof window === "undefined") {
    return;
  }

  handleTokenExpiry(payload, status);

  const error = payload as SubscriptionErrorPayload | null;
  if (
    error?.code !== "SUBSCRIPTION_EXPIRED" &&
    error?.code !== "SUBSCRIPTION_REQUIRED"
  ) {
    return;
  }

  clearDealerSession();
  window.location.assign("/register?step=subscription");
}
