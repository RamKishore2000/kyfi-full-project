export const ADMIN_PERMISSIONS = [
  "dashboard.view",
  "farmers.view",
  "dealers.view",
  "dealers.add",
  "dealers.change_status",
  "notifications.view",
  "notifications.send",
  "banner.view",
  "banner.update",
  "subscription.view",
  "subscription.update",
  "admins.view",
  "admins.add",
  "admins.update_permissions",
  "admins.update_status",
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export type AdminAccess = {
  id: number;
  role: "admin";
  adminRole: "SUPER_ADMIN" | "ADMIN";
  name: string;
  mobile: string;
  status: string;
  permissions: AdminPermission[];
};

export const ADMIN_PERMISSION_LABELS: Record<AdminPermission, string> = {
  "dashboard.view": "Dashboard view",
  "farmers.view": "Farmers view only",
  "dealers.view": "Dealers view",
  "dealers.add": "Add dealers",
  "dealers.change_status": "Approve / reject / suspend dealers",
  "notifications.view": "Notifications view",
  "notifications.send": "Send notifications",
  "banner.view": "Banner view",
  "banner.update": "Update banner",
  "subscription.view": "Subscription view",
  "subscription.update": "Update subscription price",
  "admins.view": "Admins view",
  "admins.add": "Add admins",
  "admins.update_permissions": "Update admin permissions",
  "admins.update_status": "Suspend / activate admins",
};

const STORAGE_KEY = "kyfi_admin_access";

export function setStoredAdminAccess(access: AdminAccess) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(access));
  window.localStorage.setItem("kyfi_admin_admin_role", access.adminRole);
  window.localStorage.setItem(
    "kyfi_admin_permissions",
    JSON.stringify(access.permissions),
  );
}

export function clearStoredAdminAccess() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem("kyfi_admin_admin_role");
  window.localStorage.removeItem("kyfi_admin_permissions");
}

export function getStoredAdminAccess(): AdminAccess | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AdminAccess) : null;
  } catch {
    return null;
  }
}

export function hasAdminPermission(permission: AdminPermission) {
  const access = getStoredAdminAccess();
  if (!access) return false;
  if (access.adminRole === "SUPER_ADMIN") return true;
  return access.permissions.includes(permission);
}

export function hasAnyAdminPermission(permissions: AdminPermission[]) {
  const access = getStoredAdminAccess();
  if (!access) return false;
  if (access.adminRole === "SUPER_ADMIN") return true;
  return permissions.some((permission) =>
    access.permissions.includes(permission),
  );
}
