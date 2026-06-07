"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Loader2, Save, ShieldCheck, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/navigation/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ADMIN_PERMISSION_LABELS,
  ADMIN_PERMISSIONS,
  type AdminAccess,
  type AdminPermission,
} from "@/lib/admin-permissions";
import {
  createAdminUser,
  fetchAdminUsers,
  updateAdminUserPermissions,
  updateAdminUserStatus,
} from "@/lib/api/admin-users";

const DEFAULT_PERMISSIONS: AdminPermission[] = [
  "dashboard.view",
  "farmers.view",
  "dealers.view",
];

const permissionGroups: Array<{
  title: string;
  permissions: AdminPermission[];
}> = [
  {
    title: "Dashboard",
    permissions: ["dashboard.view"],
  },
  {
    title: "Farmers",
    permissions: ["farmers.view"],
  },
  {
    title: "Dealers",
    permissions: ["dealers.view", "dealers.add", "dealers.change_status"],
  },
  {
    title: "Notifications",
    permissions: ["notifications.view", "notifications.send"],
  },
  {
    title: "Banner",
    permissions: ["banner.view", "banner.update"],
  },
  {
    title: "Subscription",
    permissions: ["subscription.view", "subscription.update"],
  },
  {
    title: "Admin users",
    permissions: [
      "admins.view",
      "admins.add",
      "admins.update_permissions",
      "admins.update_status",
    ],
  },
];

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<AdminAccess[]>([]);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [permissions, setPermissions] =
    useState<AdminPermission[]>(DEFAULT_PERMISSIONS);
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [savingPermissionId, setSavingPermissionId] = useState<number | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let mounted = true;

    fetchAdminUsers()
      .then((response) => {
        if (!mounted) return;
        setAdmins(response.admins);
      })
      .catch((fetchError) => {
        if (!mounted) return;
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load admins",
        );
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const permissionSet = useMemo(() => new Set(permissions), [permissions]);

  function togglePermission(permission: AdminPermission) {
    setPermissions((current) =>
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission],
    );
  }

  async function handleCreateAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim() || !mobile.trim() || !password.trim()) {
      setError("Admin name, mobile number, and password are required");
      return;
    }

    setSavingAdmin(true);

    try {
      const response = await createAdminUser({
        name: name.trim(),
        mobile: mobile.trim(),
        password: password.trim(),
        permissions,
      });

      setAdmins((current) => [response.admin, ...current]);
      setName("");
      setMobile("");
      setPassword("");
      setPermissions(DEFAULT_PERMISSIONS);
      setSuccess(response.message);
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Failed to create admin",
      );
    } finally {
      setSavingAdmin(false);
    }
  }

  async function handleToggleExisting(
    admin: AdminAccess,
    permission: AdminPermission,
  ) {
    if (admin.adminRole === "SUPER_ADMIN") return;

    const nextPermissions = admin.permissions.includes(permission)
      ? admin.permissions.filter((item) => item !== permission)
      : [...admin.permissions, permission];

    setSavingPermissionId(admin.id);
    setError("");
    setSuccess("");

    try {
      await updateAdminUserPermissions(admin.id, nextPermissions);
      setAdmins((current) =>
        current.map((item) =>
          item.id === admin.id
            ? { ...item, permissions: nextPermissions }
            : item,
        ),
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Failed to update permissions",
      );
    } finally {
      setSavingPermissionId(null);
    }
  }

  async function handleStatusToggle(admin: AdminAccess) {
    if (admin.adminRole === "SUPER_ADMIN") return;

    const nextStatus = admin.status === "approved" ? "suspended" : "approved";
    setSavingPermissionId(admin.id);
    setError("");
    setSuccess("");

    try {
      await updateAdminUserStatus(admin.id, nextStatus);
      setAdmins((current) =>
        current.map((item) =>
          item.id === admin.id ? { ...item, status: nextStatus } : item,
        ),
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Failed to update admin status",
      );
    } finally {
      setSavingPermissionId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Admin access"
        description="Create admins and assign exact access using permissions."
      />

      <div className="space-y-6">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Add admin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleCreateAdmin}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium">
                  Admin name
                  <Input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </label>
                <label className="space-y-2 text-sm font-medium">
                  Mobile number
                  <Input
                    value={mobile}
                    onChange={(event) => setMobile(event.target.value)}
                    inputMode="tel"
                    maxLength={10}
                  />
                </label>
                <label className="space-y-2 text-sm font-medium sm:col-span-2">
                  Password
                  <Input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type="password"
                  />
                </label>
              </div>

              <PermissionChecklist
                selected={permissionSet}
                onToggle={togglePermission}
              />

              {error ? (
                <p className="text-sm font-medium text-red-600">{error}</p>
              ) : null}
              {success ? (
                <p className="text-sm font-medium text-emerald-700">
                  {success}
                </p>
              ) : null}

              <Button type="submit" className="w-full" disabled={savingAdmin}>
                {savingAdmin ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Create admin
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Admin users
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                Loading admins...
              </div>
            ) : (
              <div className="space-y-4">
                {admins
                  .filter((admin) => admin.adminRole !== "SUPER_ADMIN")
                  .map((admin) => (
                    <div
                      key={admin.id}
                      className="rounded-2xl border bg-card p-5 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{admin.name}</p>
                            <Badge
                              variant={
                                admin.adminRole === "SUPER_ADMIN"
                                  ? "green"
                                  : "muted"
                              }
                            >
                              {admin.adminRole === "SUPER_ADMIN"
                                ? "Super admin"
                                : "Admin"}
                            </Badge>
                            <Badge
                              variant={
                                admin.status === "approved" ? "green" : "muted"
                              }
                            >
                              {admin.status}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {admin.mobile}
                          </p>
                        </div>
                        {admin.adminRole !== "SUPER_ADMIN" ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusToggle(admin)}
                            disabled={savingPermissionId === admin.id}
                          >
                            {admin.status === "approved"
                              ? "Suspend"
                              : "Activate"}
                          </Button>
                        ) : null}
                      </div>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {ADMIN_PERMISSIONS.map((permission) => (
                          <label
                            key={permission}
                            className="flex items-center gap-2 rounded-xl border bg-muted/20 px-3 py-2 text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={
                                admin.adminRole === "SUPER_ADMIN" ||
                                admin.permissions.includes(permission)
                              }
                              disabled={
                                admin.adminRole === "SUPER_ADMIN" ||
                                savingPermissionId === admin.id
                              }
                              onChange={() =>
                                handleToggleExisting(admin, permission)
                              }
                            />
                            <span>{ADMIN_PERMISSION_LABELS[permission]}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function PermissionChecklist({
  selected,
  onToggle,
}: {
  selected: Set<AdminPermission>;
  onToggle: (permission: AdminPermission) => void;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {permissionGroups.map((group) => (
        <div key={group.title} className="rounded-2xl border bg-muted/20 p-4">
          <p className="mb-3 text-sm font-semibold">{group.title}</p>
          <div className="grid gap-2">
            {group.permissions.map((permission) => (
              <label
                key={permission}
                className="flex items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selected.has(permission)}
                  onChange={() => onToggle(permission)}
                />
                <span>{ADMIN_PERMISSION_LABELS[permission]}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
