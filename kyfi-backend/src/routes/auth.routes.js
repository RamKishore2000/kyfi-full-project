const express = require("express");
const {
  registerDealer,
  loginDealer,
  requestDealerOtp,
  resendDealerOtp,
  verifyDealerOtp,
  getCurrentDealer,
  updateCurrentDealerProfile,
  updateCurrentDealerPassword,
  updateCurrentDealerSettings,
} = require("../controllers/dealer-auth.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/register", registerDealer);
router.post("/login", loginDealer);
router.post("/login/otp/request", requestDealerOtp);
router.post("/login/otp/resend", resendDealerOtp);
router.post("/login/otp/verify", verifyDealerOtp);
router.get("/dealer/me", requireAuth, getCurrentDealer);
router.patch("/dealer/me", requireAuth, updateCurrentDealerProfile);
router.patch("/dealer/me/settings", requireAuth, updateCurrentDealerSettings);
router.patch("/dealer/me/password", requireAuth, updateCurrentDealerPassword);

module.exports = { router };
