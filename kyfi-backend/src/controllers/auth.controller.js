const bcrypt = require("bcrypt");
const { findDealerByMobile } = require("../services/dealer.service");
const { signJwt } = require("../utils/jwt");

const loginDealer = async (req, res, next) => {
  const { mobile, password, otp, mode } = req.body || {};

  if (!mobile) {
    return res.status(400).json({ message: "Mobile number is required" });
  }

  try {
    const dealer = await findDealerByMobile(mobile);

    if (!dealer) {
      return res.status(404).json({ message: "Dealer not found" });
    }

    const secret = process.env.JWT_SECRET || "kyfi-secret-key";
    const loginMode = mode === "otp" ? "otp" : "password";

    if (loginMode === "otp") {
      if (String(otp || "").trim() !== "1111") {
        return res.status(401).json({ message: "Invalid OTP" });
      }
    } else {
      if (!password) {
        return res.status(400).json({ message: "Password is required" });
      }

      let isPasswordValid = false;

      if (dealer.role === "admin" && !dealer.password_hash) {
        const adminPassword = process.env.ADMIN_PASSWORD || "admin1234";
        isPasswordValid = password === adminPassword;
      } else {
        if (!dealer.password_hash) {
          return res.status(400).json({ message: "Password login is not available for this dealer" });
        }

        isPasswordValid = await bcrypt.compare(password, dealer.password_hash);
      }

      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid password" });
      }
    }

    if (dealer.status !== "approved") {
      return res.status(403).json({ message: "Dealer account is pending approval" });
    }

    const token = signJwt(
      {
        dealerId: dealer.id,
        role: dealer.role,
        mobile: dealer.mobile,
        status: dealer.status,
      },
      secret,
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      dealer: {
        id: dealer.id,
        role: dealer.role,
        name: dealer.name,
        mobile: dealer.mobile,
        shopName: dealer.shop_name,
        district: dealer.district,
        state: dealer.state,
        mandal: dealer.mandal,
        village: dealer.village,
        aadhaarOrGstNumber: dealer.aadhaar_or_gst_number,
        status: dealer.status,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { loginDealer };
