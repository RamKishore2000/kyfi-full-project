const express = require("express");
const {
  registerDealer,
  loginDealer,
  getCurrentDealer,
  updateCurrentDealerProfile,
  updateCurrentDealerPassword,
  updateCurrentDealerSettings,
} = require("../controllers/dealer-auth.controller");
const {
  checkFarmerStatus,
  searchFarmerStatus,
  addFarmerStatus,
  voteFarmerStatusById,
} = require("../controllers/farmer-status.controller");
const {
  checkBlacklistEntry,
  addBlacklistEntry,
  searchBlacklist,
} = require("../controllers/blacklist.controller");
const { getCurrentDealerRecords } = require("../controllers/dealer-records.controller");
const { getDealers, updateDealerStatus } = require("../controllers/admin-dealers.controller");
const { listFarmers } = require("../controllers/admin-farmers.controller");
const { listBlacklist, removeBlacklist } = require("../controllers/admin-blacklist.controller");
const { getAdminDashboard } = require("../controllers/admin-dashboard.controller");
const { requireAdmin, requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/register", registerDealer);
router.post("/login", loginDealer);
router.get("/dealer/me", requireAuth, getCurrentDealer);
router.patch("/dealer/me", requireAuth, updateCurrentDealerProfile);
router.patch("/dealer/me/settings", requireAuth, updateCurrentDealerSettings);
router.get("/dealer/me/records", requireAuth, getCurrentDealerRecords);
router.patch("/dealer/me/password", requireAuth, updateCurrentDealerPassword);
router.post("/farmer-statuses/check", requireAuth, checkFarmerStatus);
router.post("/farmer-statuses/search", requireAuth, searchFarmerStatus);
router.post("/farmer-statuses", requireAuth, addFarmerStatus);
router.post("/farmer-statuses/:id/vote", requireAuth, voteFarmerStatusById);
router.post("/blacklist/check", requireAuth, checkBlacklistEntry);
router.post("/blacklist/search", requireAuth, searchBlacklist);
router.post("/blacklist", requireAuth, addBlacklistEntry);
router.get("/admin/dealers", requireAdmin, getDealers);
router.patch("/admin/dealers/:id/status", requireAdmin, updateDealerStatus);
router.get("/admin/farmers", requireAdmin, listFarmers);
router.get("/admin/blacklist", requireAdmin, listBlacklist);
router.delete("/admin/blacklist/:id", requireAdmin, removeBlacklist);
router.get("/admin/dashboard", requireAdmin, getAdminDashboard);

module.exports = { router };