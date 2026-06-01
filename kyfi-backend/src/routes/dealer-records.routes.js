const express = require("express");
const { getCurrentDealerRecords } = require("../controllers/dealer-records.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/dealer/me/records", requireAuth, getCurrentDealerRecords);

module.exports = { router };
