import type { AdminAccess, AdminPermission } from "@/lib/admin-permissions";
import { adminAuthFetch } from "@/lib/api/admin-access";

export type AdminUsersResponse = {
  admins: AdminAccess[];
  permissionsCatalog: AdminPermission[];
};

export async function fetchAdminUsers() {
  return adminAuthFetch<AdminUsersResponse>("/admin/admin-users");
}

export async function createAdminUser(input: {
  name: string;
  mobile: string;
  password: string;
  permissions: AdminPermission[];
}) {
  return adminAuthFetch<{ message: string; admin: AdminAccess }>(
    "/admin/admin-users",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export async function updateAdminUserPermissions(
  adminId: number,
  permissions: AdminPermission[],
) {
  return adminAuthFetch<{
    message: string;
    admin: { id: number; permissions: AdminPermission[] };
  }>(`/admin/admin-users/${adminId}/permissions`, {
    method: "PATCH",
    body: JSON.stringify({ permissions }),
  });
}

export async function updateAdminUserStatus(
  adminId: number,
  status: "approved" | "suspended",
) {
  return adminAuthFetch<{
    message: string;
    admin: { id: number; status: string };
  }>(`/admin/admin-users/${adminId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
