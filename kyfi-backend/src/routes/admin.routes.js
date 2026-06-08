const express = require("express");
const {
  getDealers,
  createDealerFromAdmin,
  updateDealerStatus,
} = require("../controllers/admin-dealers.controller");
const {
  decrementSuperAdminVote,
  incrementSuperAdminVote,
  listFarmers,
  listFarmerVotes,
} = require("../controllers/admin-farmers.controller");
const {
  listBlacklist,
  removeBlacklist,
} = require("../controllers/admin-blacklist.controller");
const {
  getAdminDashboard,
} = require("../controllers/admin-dashboard.controller");
const {
  getAdminSubscription,
  updateAdminSubscription,
} = require("../controllers/subscription.controller");
const {
  getAdminHeroBanner,
  updateAdminHeroBanner,
} = require("../controllers/site-banner.controller");
const {
  listNotifications,
  sendNotification,
} = require("../controllers/admin-notifications.controller");
const {
  getCurrentAdmin,
  getAdminUsers,
  addAdminUser,
  changeAdminPermissions,
  changeAdminStatus,
} = require("../controllers/admin-users.controller");
const {
  requireAdmin,
  requirePermission,
  requireAnyPermission,
} = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/admin/me", requireAdmin, getCurrentAdmin);
router.get(
  "/admin/admin-users",
  requireAdmin,
  requirePermission("admins.view"),
  getAdminUsers,
);
router.post(
  "/admin/admin-users",
  requireAdmin,
  requirePermission("admins.add"),
  addAdminUser,
);
router.patch(
  "/admin/admin-users/:id/permissions",
  requireAdmin,
  requirePermission("admins.update_permissions"),
  changeAdminPermissions,
);
router.patch(
  "/admin/admin-users/:id/status",
  requireAdmin,
  requirePermission("admins.update_status"),
  changeAdminStatus,
);

router.get(
  "/admin/dealers",
  requireAdmin,
  requireAnyPermission(["dealers.view", "notifications.send"]),
  getDealers,
);
router.post(
  "/admin/dealers",
  requireAdmin,
  requirePermission("dealers.add"),
  createDealerFromAdmin,
);
router.patch(
  "/admin/dealers/:id/status",
  requireAdmin,
  requirePermission("dealers.change_status"),
  updateDealerStatus,
);
router.get(
  "/admin/farmers",
  requireAdmin,
  requirePermission("farmers.view"),
  listFarmers,
);
router.get(
  "/admin/farmers/:id/votes",
  requireAdmin,
  requirePermission("farmers.view"),
  listFarmerVotes,
);
router.post(
  "/admin/farmers/:id/super-vote/increment",
  requireAdmin,
  requirePermission("farmers.view"),
  incrementSuperAdminVote,
);
router.post(
  "/admin/farmers/:id/super-vote/decrement",
  requireAdmin,
  requirePermission("farmers.view"),
  decrementSuperAdminVote,
);
router.get(
  "/admin/blacklist",
  requireAdmin,
  requirePermission("farmers.view"),
  listBlacklist,
);
router.delete(
  "/admin/blacklist/:id",
  requireAdmin,
  requirePermission("farmers.view"),
  removeBlacklist,
);
router.get(
  "/admin/dashboard",
  requireAdmin,
  requirePermission("dashboard.view"),
  getAdminDashboard,
);
router.get(
  "/admin/subscription",
  requireAdmin,
  requirePermission("subscription.view"),
  getAdminSubscription,
);
router.patch(
  "/admin/subscription",
  requireAdmin,
  requirePermission("subscription.update"),
  updateAdminSubscription,
);
router.get(
  "/admin/site-banner",
  requireAdmin,
  requirePermission("banner.view"),
  getAdminHeroBanner,
);
router.patch(
  "/admin/site-banner",
  requireAdmin,
  requirePermission("banner.update"),
  updateAdminHeroBanner,
);
router.get(
  "/admin/notifications",
  requireAdmin,
  requireAnyPermission(["notifications.view", "notifications.send"]),
  listNotifications,
);
router.post(
  "/admin/notifications",
  requireAdmin,
  requirePermission("notifications.send"),
  sendNotification,
);

module.exports = { router };
