const express = require("express");
const {
  checkBlacklistEntry,
  addBlacklistEntry,
  reportBlacklistEntry,
  removeBlacklistReport,
  searchBlacklist,
} = require("../controllers/blacklist.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/blacklist/check", requireAuth, checkBlacklistEntry);
router.post("/blacklist/search", requireAuth, searchBlacklist);
router.post("/blacklist", requireAuth, addBlacklistEntry);
router.post("/blacklist/:id/report", requireAuth, reportBlacklistEntry);
router.delete("/blacklist/:id/report", requireAuth, removeBlacklistReport);

module.exports = { router };
