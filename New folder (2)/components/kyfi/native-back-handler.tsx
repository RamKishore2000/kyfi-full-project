"use client";

import { useEffect } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { usePathname, useRouter } from "next/navigation";

const ROUTE_STACK_KEY = "kyfiNativeRouteStack";

const policyRoutes = new Set([
  "/privacy-policy",
  "/terms-of-use",
  "/refund-policy",
  "/cancellation-policy",
  "/digital-service-delivery",
  "/contact-support",
  "/subscription-pricing",
]);

function normalizeRoute(pathname: string) {
  if (!pathname || pathname === "/") {
    return "/dashboard";
  }

  return pathname.endsWith("/") && pathname.length > 1
    ? pathname.slice(0, -1)
    : pathname;
}

function getFallbackRoute(pathname: string) {
  if (policyRoutes.has(pathname) || pathname === "/change-password") {
    return "/settings";
  }

  if (pathname === "/register") {
    return "/login";
  }

  return "/dashboard";
}

function readRouteStack() {
  try {
    const storedStack = window.sessionStorage.getItem(ROUTE_STACK_KEY);
    const parsedStack = storedStack ? JSON.parse(storedStack) : [];
    return Array.isArray(parsedStack)
      ? parsedStack.filter((route): route is string => typeof route === "string")
      : [];
  } catch {
    return [];
  }
}

function writeRouteStack(stack: string[]) {
  window.sessionStorage.setItem(ROUTE_STACK_KEY, JSON.stringify(stack));
}

function resolvePreviousRoute(currentRoute: string) {
  const stack = readRouteStack();

  while (stack.length > 0 && stack[stack.length - 1] === currentRoute) {
    stack.pop();
  }

  const previousRoute = stack.pop() ?? getFallbackRoute(currentRoute);

  writeRouteStack(previousRoute ? [...stack, previousRoute] : stack);
  return previousRoute;
}

export function NativeBackHandler() {
  const pathname = usePathname();
  const router = useRouter();
  const currentRoute = normalizeRoute(pathname ?? "/dashboard");

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const stack = readRouteStack();

    if (stack[stack.length - 1] !== currentRoute) {
      writeRouteStack([...stack, currentRoute].slice(-20));
    }
  }, [currentRoute]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    let removeListener: (() => Promise<void>) | undefined;

    void App.addListener("backButton", () => {
      const activeElement = document.activeElement;

      if (activeElement instanceof HTMLElement) {
        activeElement.blur();
      }

      const nextRoute = resolvePreviousRoute(currentRoute);

      if (nextRoute && nextRoute !== currentRoute) {
        router.replace(nextRoute as Parameters<typeof router.replace>[0]);
      }
    }).then((listener) => {
      removeListener = () => listener.remove();
    });

    return () => {
      void removeListener?.();
    };
  }, [currentRoute, router]);

  return null;
}
