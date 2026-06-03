const express = require("express");
const { getPublicHeroBanner } = require("../controllers/site-banner.controller");
const {
  getMandals,
  searchMandalsHandler,
  searchVillagesHandler,
  getVillagesByMandal,
  searchDistrictsHandler,
  addMandalHandler,
  addVillageHandler,
} = require("../controllers/mandal.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/site-banner", getPublicHeroBanner);
router.get("/locations/mandals", getMandals);
router.get("/mandals/search", searchMandalsHandler);
router.get("/villages/search", searchVillagesHandler);
router.get("/villages/by-mandal/:mandalId", getVillagesByMandal);
router.get("/districts/search", searchDistrictsHandler);
router.post("/mandals", addMandalHandler);
router.post("/villages", addVillageHandler);

module.exports = { router };
