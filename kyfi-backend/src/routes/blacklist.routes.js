const express = require("express");
const {
  checkBlacklistEntry,
  addBlacklistEntry,
  searchBlacklist,
} = require("../controllers/blacklist.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/blacklist/check", requireAuth, checkBlacklistEntry);
router.post("/blacklist/search", requireAuth, searchBlacklist);
router.post("/blacklist", requireAuth, addBlacklistEntry);

module.exports = { router };
