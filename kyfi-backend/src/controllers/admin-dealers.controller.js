const { findDealerById, listDealers, updateDealerStatusById } = require("../services/dealer.service");
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
    return res.status(400).json({ message: "Status must be approved, rejected, or suspended" });
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
        const notificationContent = buildDealerStatusNotificationContent(normalizedStatus);

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

module.exports = {
  getDealers,
  updateDealerStatus,
};
