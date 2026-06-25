"use client";

const NATIVE_MEDIA_RETURN_ROUTE_KEY = "kyfi_native_media_return_route";
const NATIVE_MEDIA_RETURN_EXPIRES_KEY = "kyfi_native_media_return_expires";
const NATIVE_MEDIA_RETURN_TTL_MS = 3 * 60 * 1000;
export const NATIVE_MEDIA_RESULT_EVENT = "kyfi-native-media-result";
export const ACTIVE_NATIVE_PICKER_KEY = "kyfi_active_native_proof_picker";

const NATIVE_MEDIA_SCROLL_Y_KEY = "kyfi_native_media_scroll_y";
const NATIVE_MEDIA_PENDING_PHOTO_KEY = "kyfi_native_media_pending_photo";

export function rememberNativeMediaReturnRoute() {
  if (typeof window === "undefined") {
    return;
  }

  const route = `${window.location.pathname}${window.location.search}`;
  window.localStorage.setItem(NATIVE_MEDIA_RETURN_ROUTE_KEY, route);
  window.localStorage.setItem(
    NATIVE_MEDIA_RETURN_EXPIRES_KEY,
    String(Date.now() + NATIVE_MEDIA_RETURN_TTL_MS),
  );
  window.localStorage.setItem(
    NATIVE_MEDIA_SCROLL_Y_KEY,
    String(window.scrollY || 0),
  );
}

export function consumeNativeMediaReturnRoute() {
  if (typeof window === "undefined") {
    return null;
  }

  const route = window.localStorage.getItem(NATIVE_MEDIA_RETURN_ROUTE_KEY);
  const expiresAt = Number(
    window.localStorage.getItem(NATIVE_MEDIA_RETURN_EXPIRES_KEY) || "0",
  );

  window.localStorage.removeItem(NATIVE_MEDIA_RETURN_ROUTE_KEY);
  window.localStorage.removeItem(NATIVE_MEDIA_RETURN_EXPIRES_KEY);

  if (!route || !expiresAt || expiresAt < Date.now()) {
    return null;
  }

  return route.startsWith("/") ? route : null;
}

export function rememberActiveNativePicker(pickerId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ACTIVE_NATIVE_PICKER_KEY, pickerId);
}

export function clearActiveNativePicker() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ACTIVE_NATIVE_PICKER_KEY);
}

export function getActiveNativePicker() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(ACTIVE_NATIVE_PICKER_KEY);
}

export function restoreNativeMediaScrollPosition() {
  if (typeof window === "undefined") {
    return;
  }

  const savedScroll = Number(
    window.localStorage.getItem(NATIVE_MEDIA_SCROLL_Y_KEY) || "0",
  );
  window.localStorage.removeItem(NATIVE_MEDIA_SCROLL_Y_KEY);

  if (Number.isFinite(savedScroll) && savedScroll > 0) {
    window.setTimeout(() => {
      window.scrollTo({ top: savedScroll, behavior: "auto" });
    }, 50);
  }
}

export function storePendingNativePhoto(pickerId: string, photo: unknown) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    NATIVE_MEDIA_PENDING_PHOTO_KEY,
    JSON.stringify({ pickerId, photo, expiresAt: Date.now() + NATIVE_MEDIA_RETURN_TTL_MS }),
  );
  window.dispatchEvent(new Event(NATIVE_MEDIA_RESULT_EVENT));
}

export function consumePendingNativePhoto(pickerId: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(NATIVE_MEDIA_PENDING_PHOTO_KEY);
  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored) as {
      pickerId?: string;
      photo?: unknown;
      expiresAt?: number;
    };

    if (parsed.expiresAt && parsed.expiresAt < Date.now()) {
      window.localStorage.removeItem(NATIVE_MEDIA_PENDING_PHOTO_KEY);
      return null;
    }

    if (parsed.pickerId !== pickerId) {
      return null;
    }

    window.localStorage.removeItem(NATIVE_MEDIA_PENDING_PHOTO_KEY);
    return parsed.photo;
  } catch {
    window.localStorage.removeItem(NATIVE_MEDIA_PENDING_PHOTO_KEY);
    return null;
  }
}
