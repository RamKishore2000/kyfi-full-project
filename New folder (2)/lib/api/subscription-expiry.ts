type SubscriptionErrorPayload = {
  code?: string;
  message?: string;
};

const SUBSCRIPTION_REDIRECT_KEY = "kyfi_subscription_redirect_started_at";
const SUBSCRIPTION_REQUIRED_KEY = "kyfi_subscription_required";
const SUBSCRIPTION_REDIRECT_WINDOW_MS = 60000;

export function isSubscriptionRedirectPending() {
  if (typeof window === "undefined") {
    return false;
  }

  const startedAt = Number(
    window.localStorage.getItem(SUBSCRIPTION_REDIRECT_KEY) ||
      window.sessionStorage.getItem(SUBSCRIPTION_REDIRECT_KEY) ||
      0,
  );
  const subscriptionRequired =
    window.localStorage.getItem(SUBSCRIPTION_REQUIRED_KEY) === "1";

  return subscriptionRequired || (
    Number.isFinite(startedAt) &&
    startedAt > 0 &&
    Date.now() - startedAt < SUBSCRIPTION_REDIRECT_WINDOW_MS
  );
}

export function clearSubscriptionRedirect() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SUBSCRIPTION_REDIRECT_KEY);
  window.localStorage.removeItem(SUBSCRIPTION_REQUIRED_KEY);
  window.sessionStorage.removeItem(SUBSCRIPTION_REDIRECT_KEY);
}

function markSubscriptionRedirect() {
  const now = String(Date.now());
  window.localStorage.setItem(SUBSCRIPTION_REQUIRED_KEY, "1");
  window.localStorage.setItem(SUBSCRIPTION_REDIRECT_KEY, now);
  window.sessionStorage.setItem(SUBSCRIPTION_REDIRECT_KEY, now);
}

function parseStoredDealer() {
  const rawDealer =
    window.localStorage.getItem("kyfi_dealer") ||
    window.localStorage.getItem("kyfi_pending_dealer");

  if (!rawDealer) {
    return null;
  }

  try {
    return JSON.parse(rawDealer) as {
      subscriptionStatus?: string;
      subscriptionExpiresAt?: string | null;
      subscription_status?: string;
      subscription_expires_at?: string | null;
      trialStatus?: string;
      trialExpiresAt?: string | null;
      trial_status?: string;
      trial_expires_at?: string | null;
      accessStatus?: string;
    };
  } catch {
    return null;
  }
}

function hasActiveAccessFromStoredDealer() {
  const dealer = parseStoredDealer();
  if (!dealer) {
    return null;
  }

  const subscriptionStatus = String(
    dealer.subscriptionStatus || dealer.subscription_status || "",
  )
    .trim()
    .toLowerCase();
  const subscriptionExpiresAt = dealer.subscriptionExpiresAt
    ? new Date(dealer.subscriptionExpiresAt)
    : dealer.subscription_expires_at
      ? new Date(dealer.subscription_expires_at)
      : null;
  const subscriptionActive =
    subscriptionStatus === "active" &&
    !!subscriptionExpiresAt &&
    !Number.isNaN(subscriptionExpiresAt.getTime()) &&
    subscriptionExpiresAt.getTime() > Date.now();

  const trialStatus = String(dealer.trialStatus || dealer.trial_status || "")
    .trim()
    .toLowerCase();
  const trialExpiresAt = dealer.trialExpiresAt
    ? new Date(dealer.trialExpiresAt)
    : dealer.trial_expires_at
      ? new Date(dealer.trial_expires_at)
      : null;
  const trialActive =
    trialStatus === "active" &&
    !!trialExpiresAt &&
    !Number.isNaN(trialExpiresAt.getTime()) &&
    trialExpiresAt.getTime() > Date.now();

  const backendAllowsAccess =
    String(dealer.accessStatus || "").trim().toLowerCase() === "allowed";

  return subscriptionActive || trialActive || backendAllowsAccess;
}

function clearDealerSession(options: { notify?: boolean } = {}) {
  const dealer = window.localStorage.getItem("kyfi_dealer");
  if (dealer) {
    window.localStorage.setItem("kyfi_pending_dealer", dealer);
  }

  window.localStorage.removeItem("kyfi_token");
  window.localStorage.removeItem("kyfi_dealer");
  if (options.notify !== false) {
    window.dispatchEvent(new Event("kyfi-auth-changed"));
  }
}

function redirectToSubscription() {
  markSubscriptionRedirect();
  clearDealerSession({ notify: false });
  window.location.replace("/register?step=subscription");
}

export function handleTokenExpiry(payload: unknown, status?: number) {
  if (typeof window === "undefined") {
    return;
  }

  if (isSubscriptionRedirectPending()) {
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

  const hasActiveAccess = hasActiveAccessFromStoredDealer();
  if (hasActiveAccess === false) {
    redirectToSubscription();
    return;
  }

  clearDealerSession();
  window.location.assign("/login");
}

export function handleSubscriptionExpiry(payload: unknown, status?: number) {
  if (typeof window === "undefined") {
    return;
  }

  const error = payload as SubscriptionErrorPayload | null;
  if (
    error?.code === "SUBSCRIPTION_EXPIRED" ||
    error?.code === "SUBSCRIPTION_REQUIRED"
  ) {
    redirectToSubscription();
    return;
  }

  handleTokenExpiry(payload, status);
}
