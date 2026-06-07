const bcrypt = require("bcrypt");
const db = require("../config/db");

const ALL_ADMIN_PERMISSIONS = [
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
];

async function hasDealerColumn(columnName) {
  const [rows] = await db.execute(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'dealers'
       AND COLUMN_NAME = ?`,
    [columnName],
  );

  return Number(rows[0]?.count || 0) > 0;
}

async function ensureAdminAccessSchema() {
  const hasAdminRole = await hasDealerColumn("admin_role");
  if (!hasAdminRole) {
    await db.execute(
      "ALTER TABLE dealers ADD COLUMN admin_role ENUM('SUPER_ADMIN', 'ADMIN') DEFAULT NULL AFTER role",
    );
  }

  await db.execute(
    `CREATE TABLE IF NOT EXISTS admin_permissions (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      admin_id INT UNSIGNED NOT NULL,
      permission_key VARCHAR(80) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_admin_permission (admin_id, permission_key),
      INDEX idx_admin_permissions_admin_id (admin_id),
      CONSTRAINT fk_admin_permissions_admin
        FOREIGN KEY (admin_id) REFERENCES dealers(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  );
}

function sanitizePermissions(permissions) {
  const allowed = new Set(ALL_ADMIN_PERMISSIONS);
  return Array.from(
    new Set(
      (Array.isArray(permissions) ? permissions : [])
        .map((permission) => String(permission || "").trim())
        .filter((permission) => allowed.has(permission)),
    ),
  );
}

async function getPermissionRows(adminId) {
  const [rows] = await db.execute(
    "SELECT permission_key FROM admin_permissions WHERE admin_id = ? ORDER BY permission_key",
    [adminId],
  );

  return rows.map((row) => row.permission_key);
}

async function getAdminAccess(adminId) {
  await ensureAdminAccessSchema();

  const [rows] = await db.execute(
    `SELECT id, role, admin_role, name, mobile, status, created_at, updated_at
     FROM dealers
     WHERE id = ? AND role = 'admin'
     LIMIT 1`,
    [adminId],
  );

  const admin = rows[0] || null;
  if (!admin || admin.status !== "approved") {
    return null;
  }

  const adminRole = admin.admin_role || "SUPER_ADMIN";
  const permissions =
    adminRole === "SUPER_ADMIN"
      ? ALL_ADMIN_PERMISSIONS
      : await getPermissionRows(admin.id);

  return {
    id: admin.id,
    role: admin.role,
    adminRole,
    name: admin.name,
    mobile: admin.mobile,
    status: admin.status,
    permissions,
    createdAt: admin.created_at,
    updatedAt: admin.updated_at,
  };
}

function hasPermission(access, permission) {
  if (!access) return false;
  if (access.adminRole === "SUPER_ADMIN") return true;
  return access.permissions.includes(permission);
}

function hasAnyPermission(access, permissions) {
  if (!access) return false;
  if (access.adminRole === "SUPER_ADMIN") return true;
  return permissions.some((permission) =>
    access.permissions.includes(permission),
  );
}

async function setAdminPermissions(adminId, permissions) {
  await ensureAdminAccessSchema();
  const sanitized = sanitizePermissions(permissions);

  await db.execute("DELETE FROM admin_permissions WHERE admin_id = ?", [
    adminId,
  ]);

  for (const permission of sanitized) {
    await db.execute(
      "INSERT INTO admin_permissions (admin_id, permission_key) VALUES (?, ?)",
      [adminId, permission],
    );
  }

  return sanitized;
}

async function listAdminUsers() {
  await ensureAdminAccessSchema();

  const [rows] = await db.execute(
    `SELECT id, role, admin_role, name, mobile, status, created_at, updated_at
     FROM dealers
     WHERE role = 'admin'
     ORDER BY created_at DESC`,
  );

  const users = [];

  for (const row of rows) {
    const adminRole = row.admin_role || "SUPER_ADMIN";
    users.push({
      id: row.id,
      role: row.role,
      adminRole,
      name: row.name,
      mobile: row.mobile,
      status: row.status,
      permissions:
        adminRole === "SUPER_ADMIN"
          ? ALL_ADMIN_PERMISSIONS
          : await getPermissionRows(row.id),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  return users;
}

async function createAdminUser({ name, mobile, password, permissions }) {
  await ensureAdminAccessSchema();

  const normalizedName = String(name || "").trim();
  const normalizedMobile = String(mobile || "").trim();
  const normalizedPassword = String(password || "").trim();

  if (!normalizedName) {
    throw new Error("Admin name is required");
  }

  if (!/^[6-9]\d{9}$/.test(normalizedMobile)) {
    throw new Error("Valid 10-digit mobile number is required");
  }

  if (normalizedPassword.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  const [existing] = await db.execute(
    "SELECT id FROM dealers WHERE mobile = ? LIMIT 1",
    [normalizedMobile],
  );

  if (existing.length) {
    const error = new Error("Mobile number already exists");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(normalizedPassword, 10);

  const [result] = await db.execute(
    `INSERT INTO dealers
      (role, admin_role, name, mobile, password_hash, shop_name, district, state, mandal, village,
       aadhaar_or_gst_number, status)
     VALUES ('admin', 'ADMIN', ?, ?, ?, 'KYFI Admin', 'Admin', 'Admin', 'Admin', 'Admin', ?, 'approved')`,
    [
      normalizedName,
      normalizedMobile,
      passwordHash,
      `ADMIN-${normalizedMobile}`,
    ],
  );

  const adminId = result.insertId;
  const savedPermissions = await setAdminPermissions(adminId, permissions);

  return {
    id: adminId,
    role: "admin",
    adminRole: "ADMIN",
    name: normalizedName,
    mobile: normalizedMobile,
    status: "approved",
    permissions: savedPermissions,
  };
}

async function updateAdminPermissions(adminId, permissions) {
  await ensureAdminAccessSchema();

  const [rows] = await db.execute(
    "SELECT id, admin_role FROM dealers WHERE id = ? AND role = 'admin' LIMIT 1",
    [adminId],
  );
  const admin = rows[0] || null;

  if (!admin) {
    return null;
  }

  if ((admin.admin_role || "SUPER_ADMIN") === "SUPER_ADMIN") {
    const error = new Error("Super admin permissions cannot be edited");
    error.statusCode = 400;
    throw error;
  }

  const savedPermissions = await setAdminPermissions(adminId, permissions);
  return savedPermissions;
}

async function updateAdminStatus(adminId, status) {
  await ensureAdminAccessSchema();

  const normalizedStatus = String(status || "").toLowerCase();
  if (!["approved", "suspended"].includes(normalizedStatus)) {
    throw new Error("Status must be approved or suspended");
  }

  const [rows] = await db.execute(
    "SELECT id, admin_role FROM dealers WHERE id = ? AND role = 'admin' LIMIT 1",
    [adminId],
  );
  const admin = rows[0] || null;

  if (!admin) {
    return false;
  }

  if ((admin.admin_role || "SUPER_ADMIN") === "SUPER_ADMIN") {
    const error = new Error("Super admin status cannot be changed");
    error.statusCode = 400;
    throw error;
  }

  const [result] = await db.execute(
    "UPDATE dealers SET status = ? WHERE id = ? AND role = 'admin'",
    [normalizedStatus, adminId],
  );

  return result.affectedRows > 0;
}

module.exports = {
  ALL_ADMIN_PERMISSIONS,
  ensureAdminAccessSchema,
  getAdminAccess,
  hasPermission,
  hasAnyPermission,
  listAdminUsers,
  createAdminUser,
  updateAdminPermissions,
  updateAdminStatus,
};
