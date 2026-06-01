const {
  getAdminNotifications,
  createAdminNotification,
  mapAdminNotification,
} = require("../services/admin-notifications.service");
const { findDealerById } = require("../services/dealer.service");

const listNotifications = async (req, res, next) => {
  try {
    const notifications = await getAdminNotifications();

    return res.status(200).json({
      notifications: notifications.map(mapAdminNotification),
      total: notifications.length,
    });
  } catch (error) {
    return next(error);
  }
};

const sendNotification = async (req, res, next) => {
  const adminId = req.user?.dealerId;
  const { recipientType, title, message, dealerId } = req.body || {};
  const normalizedRecipientType = String(recipientType || "all").toLowerCase();
  const cleanTitle = String(title || "").trim();
  const cleanMessage = String(message || "").trim();
  const parsedDealerId = Number(dealerId);

  if (!adminId) {
    return res.status(401).json({ message: "Authorization token required" });
  }

  if (!cleanTitle || !cleanMessage) {
    return res.status(400).json({ message: "Title and message are required" });
  }

  if (cleanMessage.length > 1000) {
    return res.status(400).json({ message: "Message must be 1000 characters or less" });
  }

  if (!["all", "individual"].includes(normalizedRecipientType)) {
    return res.status(400).json({ message: "Recipient type must be all or individual" });
  }

  if (normalizedRecipientType === "individual" && (!Number.isFinite(parsedDealerId) || parsedDealerId <= 0)) {
    return res.status(400).json({ message: "A valid dealer must be selected" });
  }

  try {
    const admin = await findDealerById(adminId);

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    const notification = await createAdminNotification({
      recipientType: normalizedRecipientType,
      title: cleanTitle,
      message: cleanMessage,
      dealerId: normalizedRecipientType === "individual" ? parsedDealerId : null,
      sentByAdminId: adminId,
      sentByName: admin.name || "KYFI Admin",
    });

    return res.status(201).json({
      message: "Notification sent successfully",
      notification: mapAdminNotification(notification),
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listNotifications,
  sendNotification,
};
