const express = require("express");
const {
  checkFarmerStatus,
  searchFarmerStatus,
  addFarmerStatus,
  voteFarmerStatusById,
  incrementFarmerStatusCountById,
  decrementFarmerStatusCountById,
} = require("../controllers/farmer-status.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/farmer-statuses/check", requireAuth, checkFarmerStatus);
router.post("/farmer-statuses/search", requireAuth, searchFarmerStatus);
router.post("/farmer-statuses", requireAuth, addFarmerStatus);
router.post("/farmer-statuses/:id/vote", requireAuth, voteFarmerStatusById);
router.post("/farmer-statuses/:id/increment", requireAuth, incrementFarmerStatusCountById);
router.post("/farmer-statuses/:id/decrement", requireAuth, decrementFarmerStatusCountById);

module.exports = { router };
