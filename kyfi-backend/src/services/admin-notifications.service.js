const db = require("../config/db");
const { findDealerById } = require("./dealer.service");

const ensureAdminNotificationsTable = async () => {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS admin_notifications (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      recipient_type ENUM('all', 'individual') NOT NULL DEFAULT 'all',
      dealer_id BIGINT UNSIGNED NULL,
      recipient_label VARCHAR(200) NOT NULL,
      recipient_company_name VARCHAR(200) DEFAULT NULL,
      recipient_owner_name VARCHAR(200) DEFAULT NULL,
      recipient_dealer_code VARCHAR(50) DEFAULT NULL,
      recipient_mobile_number VARCHAR(20) DEFAULT NULL,
      recipient_district VARCHAR(100) DEFAULT NULL,
      title VARCHAR(200) NOT NULL,
      message TEXT NOT NULL,
      notification_type ENUM('Broadcast', 'Individual') NOT NULL DEFAULT 'Broadcast',
      status ENUM('Sent', 'Queued', 'Failed') NOT NULL DEFAULT 'Sent',
      sent_by_admin_id BIGINT UNSIGNED NOT NULL,
      sent_by_name VARCHAR(200) NOT NULL,
      sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_admin_notifications_recipient_type (recipient_type),
      KEY idx_admin_notifications_dealer_id (dealer_id),
      KEY idx_admin_notifications_sent_at (sent_at)
    )`,
  );
};

const toDateLabel = (value) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const getAdminNotifications = async () => {
  await ensureAdminNotificationsTable();

  const [rows] = await db.execute(
    `SELECT
      id,
      recipient_type,
      dealer_id,
      recipient_label,
      recipient_company_name,
      recipient_owner_name,
      recipient_dealer_code,
      recipient_mobile_number,
      recipient_district,
      title,
      message,
      notification_type,
      status,
      sent_by_name,
      sent_at,
      updated_at
     FROM admin_notifications
     ORDER BY sent_at DESC, id DESC`,
  );

  return rows;
};

const createAdminNotification = async ({
  recipientType,
  title,
  message,
  dealerId,
  sentByAdminId,
  sentByName,
}) => {
  await ensureAdminNotificationsTable();
  // TODO: Connect the real SMS provider here when SMS_AUTH_KEY, SMS_TEMPLATE_ID,
  // and SMS_SENDER_ID are added to .env. For now, notifications are stored only.

  const normalizedRecipientType = recipientType === "individual" ? "individual" : "all";
  const isIndividual = normalizedRecipientType === "individual";
  const dealer = isIndividual ? await findDealerById(dealerId) : null;

  if (isIndividual && !dealer) {
    const error = new Error("Selected dealer not found");
    error.statusCode = 404;
    throw error;
  }

  const recipientLabel = isIndividual ? dealer.shop_name || dealer.name : "All Dealers";
  const recipientDealerCode = isIndividual ? `DLR-${String(dealer.id).padStart(4, "0")}` : null;
  const notificationType = isIndividual ? "Individual" : "Broadcast";
  const status = "Sent";

  const [result] = await db.execute(
    `INSERT INTO admin_notifications
      (recipient_type, dealer_id, recipient_label, recipient_company_name, recipient_owner_name, recipient_dealer_code, recipient_mobile_number, recipient_district, title, message, notification_type, status, sent_by_admin_id, sent_by_name)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      normalizedRecipientType,
      isIndividual ? dealer.id : null,
      recipientLabel,
      isIndividual ? dealer.shop_name || dealer.name : null,
      isIndividual ? dealer.name : null,
      recipientDealerCode,
      isIndividual ? dealer.mobile : null,
      isIndividual ? dealer.district : null,
      title,
      message,
      notificationType,
      status,
      sentByAdminId,
      sentByName,
    ],
  );

  const [rows] = await db.execute(
    `SELECT
      id,
      recipient_type,
      dealer_id,
      recipient_label,
      recipient_company_name,
      recipient_owner_name,
      recipient_dealer_code,
      recipient_mobile_number,
      recipient_district,
      title,
      message,
      notification_type,
      status,
      sent_by_name,
      sent_at,
      updated_at
     FROM admin_notifications
     WHERE id = ?
     LIMIT 1`,
    [result.insertId],
  );

  return rows[0] || null;
};

const mapAdminNotification = (row) => ({
  id: row.id,
  recipientType: row.recipient_type,
  dealerId: row.dealer_id,
  recipientLabel: row.recipient_label,
  recipientCompanyName: row.recipient_company_name,
  recipientOwnerName: row.recipient_owner_name,
  recipientDealerCode: row.recipient_dealer_code,
  recipientMobileNumber: row.recipient_mobile_number,
  recipientDistrict: row.recipient_district,
  title: row.title,
  message: row.message,
  notificationType: row.notification_type,
  status: row.status,
  sentByName: row.sent_by_name,
  sentAt: row.sent_at,
  updatedAt: row.updated_at,
  dateLabel: toDateLabel(row.sent_at),
});

const buildDealerStatusNotificationContent = (status) => {
  const normalizedStatus = String(status || "").toLowerCase();

  if (normalizedStatus === "approved") {
    return {
      title: "Dealer Approved",
      message: "Your account has been approved. You can now login.",
    };
  }

  if (normalizedStatus === "rejected") {
    return {
      title: "Dealer Registration Rejected",
      message: "Your account registration has been rejected. Please contact support.",
    };
  }

  if (normalizedStatus === "suspended") {
    return {
      title: "Dealer Account Suspended",
      message: "Your account has been suspended. Please contact support.",
    };
  }

  return {
    title: "Dealer Status Updated",
    message: `Your dealer account status was updated to ${String(status || "").toUpperCase()}.`,
  };
};

module.exports = {
  getAdminNotifications,
  createAdminNotification,
  mapAdminNotification,
  buildDealerStatusNotificationContent,
};
