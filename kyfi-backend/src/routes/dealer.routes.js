const express = require("express");
const { registerDealer } = require("../controllers/dealer.controller");
const { loginDealer } = require("../controllers/auth.controller");

const router = express.Router();

router.post("/register", registerDealer);
router.post("/login", loginDealer);

module.exports = { router };
