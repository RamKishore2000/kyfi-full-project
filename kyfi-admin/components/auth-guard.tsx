"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchCurrentAdmin } from "@/lib/api/admin-access";
import {
  clearStoredAdminAccess,
  setStoredAdminAccess,
} from "@/lib/admin-permissions";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const role = window.localStorage.getItem("kyfi_admin_role");
    const token = window.localStorage.getItem("kyfi_admin_token");

    if (role !== "admin" || !token) {
      clearStoredAdminAccess();
      router.replace("/login");
      return;
    }

    fetchCurrentAdmin()
      .then((response) => {
        setStoredAdminAccess(response.admin);
        setReady(true);
      })
      .catch(() => {
        window.localStorage.removeItem("kyfi_admin_token");
        window.localStorage.removeItem("kyfi_admin_role");
        clearStoredAdminAccess();
        router.replace("/login");
      });
  }, [router]);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
}
