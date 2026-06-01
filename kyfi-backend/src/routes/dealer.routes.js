const express = require("express");
const { router: authRoutes } = require("./auth.routes");
const { router: farmerStatusRoutes } = require("./farmer-status.routes");
const { router: blacklistRoutes } = require("./blacklist.routes");
const { router: dealerRecordsRoutes } = require("./dealer-records.routes");
const { router: adminRoutes } = require("./admin.routes");
const { router: publicRoutes } = require("./public.routes");

const router = express.Router();

router.use(authRoutes);
router.use(farmerStatusRoutes);
router.use(blacklistRoutes);
router.use(dealerRecordsRoutes);
router.use(adminRoutes);
router.use(publicRoutes);

module.exports = { router };
