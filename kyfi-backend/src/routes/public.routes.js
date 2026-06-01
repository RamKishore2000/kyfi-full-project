const express = require("express");
const { getPublicHeroBanner } = require("../controllers/site-banner.controller");
const { getMandals } = require("../controllers/mandal.controller");

const router = express.Router();

router.get("/site-banner", getPublicHeroBanner);
router.get("/locations/mandals", getMandals);

module.exports = { router };
