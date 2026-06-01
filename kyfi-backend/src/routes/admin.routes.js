const express = require("express");
const { getDealers, updateDealerStatus } = require("../controllers/admin-dealers.controller");
const { listFarmers } = require("../controllers/admin-farmers.controller");
const { listBlacklist, removeBlacklist } = require("../controllers/admin-blacklist.controller");
const { getAdminDashboard } = require("../controllers/admin-dashboard.controller");
const {
  getAdminHeroBanner,
  updateAdminHeroBanner,
} = require("../controllers/site-banner.controller");
const {
  listNotifications,
  sendNotification,
} = require("../controllers/admin-notifications.controller");
const { requireAdmin } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/admin/dealers", requireAdmin, getDealers);
router.patch("/admin/dealers/:id/status", requireAdmin, updateDealerStatus);
router.get("/admin/farmers", requireAdmin, listFarmers);
router.get("/admin/blacklist", requireAdmin, listBlacklist);
router.delete("/admin/blacklist/:id", requireAdmin, removeBlacklist);
router.get("/admin/dashboard", requireAdmin, getAdminDashboard);
router.get("/admin/site-banner", requireAdmin, getAdminHeroBanner);
router.patch("/admin/site-banner", requireAdmin, updateAdminHeroBanner);
router.get("/admin/notifications", requireAdmin, listNotifications);
router.post("/admin/notifications", requireAdmin, sendNotification);

module.exports = { router };
