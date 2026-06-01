const express = require("express");
const {
  checkFarmerStatus,
  searchFarmerStatus,
  addFarmerStatus,
  voteFarmerStatusById,
} = require("../controllers/farmer-status.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/farmer-statuses/check", requireAuth, checkFarmerStatus);
router.post("/farmer-statuses/search", requireAuth, searchFarmerStatus);
router.post("/farmer-statuses", requireAuth, addFarmerStatus);
router.post("/farmer-statuses/:id/vote", requireAuth, voteFarmerStatusById);

module.exports = { router };
