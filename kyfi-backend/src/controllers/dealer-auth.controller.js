const bcrypt = require("bcrypt");
const {
  findDealerById,
  findDealerByMobile,
  createDealer,
  updateDealerPasswordById,
  updateDealerProfileById,
  updateDealerSettingsById,
} = require("../services/dealer.service");
const {
  createOrResendDealerOtp,
  verifyDealerOtp,
} = require("../services/dealer-otp.service");
const { signJwt } = require("../utils/jwt");

const registerDealer = async (req, res, next) => {
  const {
    ownerName,
    name,
    mobile,
    password,
    shopName,
    district,
    state,
    mandal,
    village,
    aadhaarNumber,
    gstNumber,
    aadhaarOrGstNumber,
  } = req.body || {};
  const dealerName = ownerName || name;

  const normalizedAadhaar = String(aadhaarNumber || "").trim();
  const normalizedGst = String(gstNumber || "").trim().toUpperCase();
  const legacyIdentifier = String(aadhaarOrGstNumber || "").trim().toUpperCase();
  const resolvedAadhaar =
    normalizedAadhaar ||
    (/^\d{12}$/.test(legacyIdentifier) ? legacyIdentifier : "");
  const resolvedGst =
    normalizedGst ||
    (/^\d{2}[A-Z0-9]{13}$/.test(legacyIdentifier) ? legacyIdentifier : "");

  if (!dealerName || !mobile || !shopName || !district || !state || !mandal || !village || (!resolvedAadhaar && !resolvedGst)) {
    return res.status(400).json({
      message: "Aadhaar number and GST number are required",
    });
  }

  try {
    const existingDealer = await findDealerByMobile(mobile);

    if (existingDealer) {
      return res.status(409).json({
        message: "Mobile number already exists",
      });
    }

    const dealer = await createDealer({
      role: "dealer",
      name: dealerName,
      mobile,
      password,
      shopName,
      district,
      state,
      mandal,
      village,
      aadhaarNumber: resolvedAadhaar,
      gstNumber: resolvedGst,
      aadhaarOrGstNumber: legacyIdentifier || [resolvedAadhaar, resolvedGst].filter(Boolean).join(" / "),
      status: "pending",
    });

    return res.status(201).json({
      message: "Registration successful",
      dealer,
    });
  } catch (error) {
    return next(error);
  }
};

const buildDealerAuthResponse = (dealer, token, message = "Login successful") => ({
  message,
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
    aadhaarNumber: dealer.aadhaar_number || null,
    gstNumber: dealer.gst_number || null,
    aadhaarOrGstNumber: dealer.aadhaar_or_gst_number,
    status: dealer.status,
    languagePreference: dealer.language_preference || "en",
    subscriptionStatus: dealer.subscription_status || "inactive",
    subscriptionPlanName: dealer.subscription_plan_name || null,
    subscriptionYearlyPrice:
      dealer.subscription_yearly_price !== null &&
      dealer.subscription_yearly_price !== undefined
        ? Number(dealer.subscription_yearly_price)
        : null,
    subscriptionStartedAt: dealer.subscription_started_at || null,
    subscriptionExpiresAt: dealer.subscription_expires_at || null,
  },
});

const loginDealer = async (req, res, next) => {
  const { mobile, password, otp, mode } = req.body || {};

  if (!mobile) {
    return res.status(400).json({ message: "Mobile number is required" });
  }

  try {
    const dealer = await findDealerByMobile(mobile);

    if (!dealer) {
      return res.status(401).json({ message: "Invalid phone number or password" });
    }

    const secret = process.env.JWT_SECRET || "kyfi-secret-key";
    const loginMode = mode === "otp" ? "otp" : "password";

    if (loginMode === "otp") {
      if (!otp) {
        const otpResult = await createOrResendDealerOtp(mobile);

        return res.status(200).json({
          message: "OTP generated successfully",
          mobile: dealer.mobile,
          expiresInMinutes: otpResult.expiresInMinutes,
          // Temporary testing value while the SMS gateway is not connected.
          // TODO: Remove test OTP 111111 after SMS provider keys are added.
          testOtp: otpResult.otpCode,
        });
      }

      const otpResult = await verifyDealerOtp(mobile, otp);
      const token = signJwt(
        {
          dealerId: dealer.id,
          role: dealer.role,
          mobile: dealer.mobile,
          status: dealer.status,
        },
        secret,
      );

      return res.status(200).json(buildDealerAuthResponse(otpResult.dealer, token, "OTP verified successfully"));
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
        return res.status(401).json({ message: "Invalid phone number or password" });
      }
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

    return res.status(200).json(buildDealerAuthResponse(dealer, token));
  } catch (error) {
    return next(error);
  }
};

const requestDealerOtp = async (req, res, next) => {
  const { mobile } = req.body || {};

  if (!mobile) {
    return res.status(400).json({ message: "Mobile number is required" });
  }

  try {
    const otpResult = await createOrResendDealerOtp(mobile);

    return res.status(200).json({
      message: otpResult.isResend ? "OTP resent successfully" : "OTP generated successfully",
      mobile: otpResult.dealer.mobile,
      expiresInMinutes: otpResult.expiresInMinutes,
      // Temporary testing value while the SMS gateway is not connected.
      // TODO: Remove test OTP 111111 after SMS provider keys are added.
      testOtp: otpResult.otpCode,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message || "Unable to generate OTP",
    });
  }
};

const resendDealerOtp = async (req, res, next) => {
  const { mobile } = req.body || {};

  if (!mobile) {
    return res.status(400).json({ message: "Mobile number is required" });
  }

  try {
    const otpResult = await createOrResendDealerOtp(mobile);

    return res.status(200).json({
      message: "OTP resent successfully",
      mobile: otpResult.dealer.mobile,
      expiresInMinutes: otpResult.expiresInMinutes,
      // Temporary testing value while the SMS gateway is not connected.
      // TODO: Remove test OTP 111111 after SMS provider keys are added.
      testOtp: otpResult.otpCode,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message || "Unable to resend OTP",
    });
  }
};

const verifyDealerOtpRequest = async (req, res, next) => {
  const { mobile, otp } = req.body || {};

  if (!mobile || !otp) {
    return res.status(400).json({ message: "Mobile number and OTP are required" });
  }

  try {
    const dealer = await findDealerByMobile(mobile);
    if (!dealer) {
      return res.status(401).json({ message: "Invalid phone number or OTP" });
    }

    const otpResult = await verifyDealerOtp(mobile, otp);
    const secret = process.env.JWT_SECRET || "kyfi-secret-key";
    const token = signJwt(
      {
        dealerId: otpResult.dealer.id,
        role: otpResult.dealer.role,
        mobile: otpResult.dealer.mobile,
        status: otpResult.dealer.status,
      },
      secret,
    );

    return res.status(200).json({
      message: "OTP verified successfully",
      token,
      dealer: {
        id: otpResult.dealer.id,
        role: otpResult.dealer.role,
        name: otpResult.dealer.name,
        mobile: otpResult.dealer.mobile,
        shopName: otpResult.dealer.shop_name,
        district: otpResult.dealer.district,
        state: otpResult.dealer.state,
        mandal: otpResult.dealer.mandal,
        village: otpResult.dealer.village,
        aadhaarOrGstNumber: otpResult.dealer.aadhaar_or_gst_number,
        status: otpResult.dealer.status,
        languagePreference: otpResult.dealer.language_preference || "en",
        subscriptionStatus: otpResult.dealer.subscription_status || "inactive",
        subscriptionPlanName: otpResult.dealer.subscription_plan_name || null,
        subscriptionYearlyPrice:
          otpResult.dealer.subscription_yearly_price !== null &&
          otpResult.dealer.subscription_yearly_price !== undefined
            ? Number(otpResult.dealer.subscription_yearly_price)
            : null,
        subscriptionStartedAt: otpResult.dealer.subscription_started_at || null,
        subscriptionExpiresAt: otpResult.dealer.subscription_expires_at || null,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message || "Unable to verify OTP",
    });
  }
};

const getCurrentDealer = async (req, res, next) => {
  const dealerId = req.user?.dealerId;

  if (!dealerId) {
    return res.status(401).json({ message: "Authorization token required" });
  }

  try {
    const dealer = await findDealerById(dealerId);

    if (!dealer) {
      return res.status(404).json({ message: "Dealer not found" });
    }

    return res.status(200).json({
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
        languagePreference: dealer.language_preference || "en",
        subscriptionStatus: dealer.subscription_status || "inactive",
        subscriptionPlanName: dealer.subscription_plan_name || null,
        subscriptionYearlyPrice:
          dealer.subscription_yearly_price !== null &&
          dealer.subscription_yearly_price !== undefined
            ? Number(dealer.subscription_yearly_price)
            : null,
        subscriptionStartedAt: dealer.subscription_started_at || null,
        subscriptionExpiresAt: dealer.subscription_expires_at || null,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const updateCurrentDealerProfile = async (req, res, next) => {
  const dealerId = req.user?.dealerId;
  const { name, mobile, shopName, district, state, mandal, village, languagePreference } = req.body || {};

  if (!dealerId) {
    return res.status(401).json({ message: "Authorization token required" });
  }

  try {
    const updated = await updateDealerProfileById(dealerId, {
      name: name ? String(name).trim() : undefined,
      mobile: mobile ? String(mobile).trim() : undefined,
      shopName: shopName ? String(shopName).trim() : undefined,
      district: district ? String(district).trim() : undefined,
      state: state ? String(state).trim() : undefined,
      mandal: mandal ? String(mandal).trim() : undefined,
      village: village ? String(village).trim() : undefined,
      languagePreference: languagePreference ? String(languagePreference).trim() : undefined,
    });

    if (!updated) {
      return res.status(400).json({ message: "No profile fields were updated" });
    }

    const dealer = await findDealerById(dealerId);

    return res.status(200).json({
      message: "Profile updated successfully",
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
        languagePreference: dealer.language_preference || "en",
        subscriptionStatus: dealer.subscription_status || "inactive",
        subscriptionPlanName: dealer.subscription_plan_name || null,
        subscriptionYearlyPrice:
          dealer.subscription_yearly_price !== null &&
          dealer.subscription_yearly_price !== undefined
            ? Number(dealer.subscription_yearly_price)
            : null,
        subscriptionStartedAt: dealer.subscription_started_at || null,
        subscriptionExpiresAt: dealer.subscription_expires_at || null,
      },
    });
  } catch (error) {
    if (error && error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Mobile number already exists",
      });
    }

    return next(error);
  }
};

const updateCurrentDealerPassword = async (req, res, next) => {
  const dealerId = req.user?.dealerId;
  const { currentPassword, newPassword } = req.body || {};

  if (!dealerId) {
    return res.status(401).json({ message: "Authorization token required" });
  }

  if (!newPassword || String(newPassword).trim().length < 4) {
    return res.status(400).json({ message: "New password must be at least 4 characters" });
  }

  try {
    const dealer = await findDealerById(dealerId);

    if (!dealer) {
      return res.status(404).json({ message: "Dealer not found" });
    }

    if (dealer.role !== "admin") {
      if (!dealer.password_hash) {
        return res.status(400).json({ message: "Password login is not available for this dealer" });
      }

      const passwordValid = await bcrypt.compare(String(currentPassword || ""), dealer.password_hash);
      if (!passwordValid) {
        return res.status(401).json({ message: "Current password is invalid" });
      }
    }

    await updateDealerPasswordById(dealerId, String(newPassword).trim());

    return res.status(200).json({
      message: "Password updated successfully",
    });
  } catch (error) {
    return next(error);
  }
};

const updateCurrentDealerSettings = async (req, res, next) => {
  const dealerId = req.user?.dealerId;
  const { languagePreference } = req.body || {};

  if (!dealerId) {
    return res.status(401).json({ message: "Authorization token required" });
  }

  if (!languagePreference) {
    return res.status(400).json({ message: "Language preference is required" });
  }

  try {
    const updated = await updateDealerSettingsById(dealerId, {
      languagePreference: String(languagePreference).trim(),
    });

    if (!updated) {
      return res.status(400).json({ message: "No settings fields were updated" });
    }

    const dealer = await findDealerById(dealerId);

    return res.status(200).json({
      message: "Settings updated successfully",
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
        languagePreference: dealer.language_preference || "en",
        subscriptionStatus: dealer.subscription_status || "inactive",
        subscriptionPlanName: dealer.subscription_plan_name || null,
        subscriptionYearlyPrice:
          dealer.subscription_yearly_price !== null &&
          dealer.subscription_yearly_price !== undefined
            ? Number(dealer.subscription_yearly_price)
            : null,
        subscriptionStartedAt: dealer.subscription_started_at || null,
        subscriptionExpiresAt: dealer.subscription_expires_at || null,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  registerDealer,
  loginDealer,
  requestDealerOtp,
  resendDealerOtp,
  verifyDealerOtp: verifyDealerOtpRequest,
  getCurrentDealer,
  updateCurrentDealerProfile,
  updateCurrentDealerPassword,
  updateCurrentDealerSettings,
};
