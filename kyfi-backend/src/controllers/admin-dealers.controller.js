const {
  createDealer,
  findDealerById,
  listDealers,
  updateDealerStatusById,
} = require("../services/dealer.service");
const {
  createAdminNotification,
  buildDealerStatusNotificationContent,
} = require("../services/admin-notifications.service");

const getDealers = async (req, res, next) => {
  try {
    const dealers = await listDealers();

    return res.status(200).json({
      dealers: dealers.map((dealer) => ({
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
        subscriptionStatus: dealer.subscription_status,
        subscriptionPlanName: dealer.subscription_plan_name,
        subscriptionYearlyPrice: dealer.subscription_yearly_price,
        subscriptionStartedAt: dealer.subscription_started_at,
        subscriptionExpiresAt: dealer.subscription_expires_at,
        createdAt: dealer.created_at,
        updatedAt: dealer.updated_at,
      })),
    });
  } catch (error) {
    return next(error);
  }
};

const updateDealerStatus = async (req, res, next) => {
  const dealerId = Number(req.params.id);
  const { status } = req.body || {};
  const normalizedStatus = String(status || "").toLowerCase();
  const allowedStatuses = new Set(["approved", "rejected", "suspended"]);

  if (!Number.isFinite(dealerId) || dealerId <= 0) {
    return res.status(400).json({ message: "Valid dealer id is required" });
  }

  if (!allowedStatuses.has(normalizedStatus)) {
    return res
      .status(400)
      .json({ message: "Status must be approved, rejected, or suspended" });
  }

  try {
    const updated = await updateDealerStatusById(dealerId, normalizedStatus);

    if (!updated) {
      return res.status(404).json({ message: "Dealer not found" });
    }

    const adminId = req.user?.dealerId;
    if (adminId) {
      const admin = await findDealerById(adminId);
      if (admin && admin.role === "admin") {
        const notificationContent =
          buildDealerStatusNotificationContent(normalizedStatus);

        await createAdminNotification({
          recipientType: "individual",
          title: notificationContent.title,
          message: notificationContent.message,
          dealerId,
          sentByAdminId: admin.id,
          sentByName: admin.name || "KYFI Admin",
        });
      }
    }

    return res.status(200).json({
      message: "Dealer status updated",
      dealer: {
        id: dealerId,
        status: normalizedStatus,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const createDealerFromAdmin = async (req, res, next) => {
  const {
    shopName,
    ownerName,
    mobile,
    password,
    district,
    state,
    mandal,
    village,
    aadhaarNumber,
    gstNumber,
    aadhaarOrGstNumber,
  } = req.body || {};

  const normalizedMobile = String(mobile || "").trim();
  const normalizedAadhaar = String(aadhaarNumber || "").trim();
  const normalizedGst = String(gstNumber || "").trim().toUpperCase();
  const legacyIdentifier = String(aadhaarOrGstNumber || "")
    .trim()
    .toUpperCase();
  const resolvedAadhaar =
    normalizedAadhaar || (/^\d{12}$/.test(legacyIdentifier) ? legacyIdentifier : "");
  const resolvedGst =
    normalizedGst ||
    (/^\d{2}[A-Z0-9]{13}$/.test(legacyIdentifier) ? legacyIdentifier : "");

  if (
    !String(shopName || "").trim() ||
    !String(ownerName || "").trim() ||
    !normalizedMobile ||
    !String(district || "").trim() ||
    !String(state || "").trim() ||
    !String(mandal || "").trim() ||
    !String(village || "").trim() ||
    !resolvedAadhaar ||
    !resolvedGst
  ) {
    return res
      .status(400)
      .json({ message: "Required dealer fields are missing" });
  }

  if (!/^[6-9]\d{9}$/.test(normalizedMobile)) {
    return res
      .status(400)
      .json({ message: "Enter a valid 10-digit mobile number" });
  }

  if (!/^\d{12}$/.test(resolvedAadhaar)) {
    return res
      .status(400)
      .json({ message: "Enter a valid 12-digit Aadhaar number" });
  }

  if (!/^\d{2}[A-Z0-9]{13}$/.test(resolvedGst)) {
    return res
      .status(400)
      .json({ message: "Enter a valid GST number" });
  }

  try {
    const dealer = await createDealer({
      role: "dealer",
      name: String(ownerName).trim(),
      mobile: normalizedMobile,
      password: String(password || "").trim() || undefined,
      shopName: String(shopName).trim(),
      district: String(district).trim(),
      state: String(state).trim(),
      mandal: String(mandal).trim(),
      village: String(village).trim(),
      aadhaarNumber: resolvedAadhaar,
      gstNumber: resolvedGst,
      aadhaarOrGstNumber: [resolvedAadhaar, resolvedGst].join(" / "),
      status: "pending",
    });

    return res.status(201).json({
      message: "Dealer created successfully",
      dealer,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getDealers,
  createDealerFromAdmin,
  updateDealerStatus,
};
