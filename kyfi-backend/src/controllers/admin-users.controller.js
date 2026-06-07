const {
  ALL_ADMIN_PERMISSIONS,
  createAdminUser,
  listAdminUsers,
  updateAdminPermissions,
  updateAdminStatus,
} = require("../services/admin-access.service");

const getCurrentAdmin = async (req, res) => {
  return res.status(200).json({
    admin: req.admin,
    permissionsCatalog: ALL_ADMIN_PERMISSIONS,
  });
};

const getAdminUsers = async (req, res, next) => {
  try {
    const admins = await listAdminUsers();
    return res.status(200).json({
      admins,
      permissionsCatalog: ALL_ADMIN_PERMISSIONS,
    });
  } catch (error) {
    return next(error);
  }
};

const addAdminUser = async (req, res, next) => {
  try {
    const admin = await createAdminUser({
      name: req.body?.name,
      mobile: req.body?.mobile,
      password: req.body?.password,
      permissions: req.body?.permissions,
    });

    return res.status(201).json({
      message: "Admin created successfully",
      admin,
    });
  } catch (error) {
    return next(error);
  }
};

const changeAdminPermissions = async (req, res, next) => {
  const adminId = Number(req.params.id);

  if (!Number.isFinite(adminId) || adminId <= 0) {
    return res.status(400).json({ message: "Valid admin id is required" });
  }

  try {
    const permissions = await updateAdminPermissions(
      adminId,
      req.body?.permissions,
    );

    if (!permissions) {
      return res.status(404).json({ message: "Admin not found" });
    }

    return res.status(200).json({
      message: "Admin permissions updated",
      admin: {
        id: adminId,
        permissions,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const changeAdminStatus = async (req, res, next) => {
  const adminId = Number(req.params.id);
  const status = String(req.body?.status || "").toLowerCase();

  if (!Number.isFinite(adminId) || adminId <= 0) {
    return res.status(400).json({ message: "Valid admin id is required" });
  }

  try {
    const updated = await updateAdminStatus(adminId, status);

    if (!updated) {
      return res.status(404).json({ message: "Admin not found" });
    }

    return res.status(200).json({
      message: "Admin status updated",
      admin: {
        id: adminId,
        status,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getCurrentAdmin,
  getAdminUsers,
  addAdminUser,
  changeAdminPermissions,
  changeAdminStatus,
};
