const crypto = require("crypto");
const db = require("../config/db");
const {
  findDealerById,
  findDealerBySubscriptionOrderId,
  updateDealerSubscriptionById,
} = require("./dealer.service");

const TABLE_NAME = "subscription_settings";
const WEBHOOK_EVENTS_TABLE = "razorpay_webhook_events";

async function ensureSubscriptionTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      plan_name VARCHAR(150) NOT NULL DEFAULT 'One Year Plan',
      yearly_price DECIMAL(10,2) NOT NULL DEFAULT 1999.00,
      currency VARCHAR(10) NOT NULL DEFAULT 'INR',
      duration_label VARCHAR(50) NOT NULL DEFAULT '1 Year',
      updated_by_admin_id BIGINT UNSIGNED DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    )
  `);

  await db.execute(`INSERT IGNORE INTO ${TABLE_NAME} (id) VALUES (1)`);
}

async function ensureWebhookEventsTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS ${WEBHOOK_EVENTS_TABLE} (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      event_id VARCHAR(100) NOT NULL,
      event_type VARCHAR(100) NOT NULL,
      razorpay_order_id VARCHAR(100) DEFAULT NULL,
      razorpay_payment_id VARCHAR(100) DEFAULT NULL,
      processing_status ENUM('processing', 'processed', 'ignored', 'failed') NOT NULL DEFAULT 'processing',
      attempt_count INT UNSIGNED NOT NULL DEFAULT 1,
      error_message VARCHAR(500) DEFAULT NULL,
      processed_at DATETIME DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_razorpay_webhook_event_id (event_id),
      KEY idx_razorpay_webhook_order_id (razorpay_order_id),
      KEY idx_razorpay_webhook_payment_id (razorpay_payment_id)
    )
  `);
}

function mapSubscriptionRow(row) {
  if (!row) {
    return {
      id: 1,
      planName: "One Year Plan",
      yearlyPrice: 1999,
      currency: "INR",
      durationLabel: "1 Year",
      updatedByAdminId: null,
      createdAt: null,
      updatedAt: null,
    };
  }

  return {
    id: Number(row.id),
    planName: row.plan_name,
    yearlyPrice: Number(row.yearly_price || 0),
    currency: row.currency || "INR",
    durationLabel: row.duration_label || "1 Year",
    updatedByAdminId: row.updated_by_admin_id || null,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}

async function getSubscriptionSettings() {
  await ensureSubscriptionTable();

  const [rows] = await db.execute(`SELECT * FROM ${TABLE_NAME} WHERE id = 1 LIMIT 1`);

  return mapSubscriptionRow(rows[0] || null);
}

async function updateSubscriptionSettings({ yearlyPrice, updatedByAdminId }) {
  await ensureSubscriptionTable();

  const normalizedPrice = Number(yearlyPrice);

  if (!Number.isFinite(normalizedPrice) || normalizedPrice < 0) {
    const error = new Error("Enter a valid yearly price");
    error.statusCode = 400;
    throw error;
  }

  await db.execute(
    `
      UPDATE ${TABLE_NAME}
      SET yearly_price = ?,
          updated_by_admin_id = ?
      WHERE id = 1
    `,
    [normalizedPrice, updatedByAdminId || null],
  );

  return getSubscriptionSettings();
}

function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID || "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET || "";

  if (!keyId || !keySecret) {
    const error = new Error("Razorpay credentials are not configured");
    error.statusCode = 500;
    throw error;
  }

  return { keyId, keySecret };
}

async function createRazorpayOrder(amountPaise, receipt, notes = {}) {
  const { keyId, keySecret } = getRazorpayCredentials();

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
    },
    body: JSON.stringify({
      amount: Math.round(amountPaise),
      currency: "INR",
      receipt,
      notes,
      payment_capture: 1,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.description || data?.message || "Unable to create Razorpay order");
  }

  return data;
}

function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  const { keySecret } = getRazorpayCredentials();
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return expectedSignature === signature;
}

function getRazorpayWebhookSecret() {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";

  if (!webhookSecret) {
    const error = new Error("Razorpay webhook secret is not configured");
    error.statusCode = 500;
    throw error;
  }

  return webhookSecret;
}

function verifyRazorpayWebhookSignature(rawBody, signature) {
  const webhookSecret = getRazorpayWebhookSecret();
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");
  const received = Buffer.from(String(signature || ""), "utf8");
  const expected = Buffer.from(expectedSignature, "utf8");

  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
}

function toMysqlDate(value) {
  return value.toISOString().slice(0, 19).replace("T", " ");
}

async function activateDealerSubscription({ dealer, orderId, paymentId, signature }) {
  if (
    dealer.subscription_status === "active" &&
    dealer.subscription_razorpay_payment_id === paymentId
  ) {
    return false;
  }

  const settings = await getSubscriptionSettings();
  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + 365 * 24 * 60 * 60 * 1000);
  const updates = {
    subscriptionStatus: "active",
    subscriptionPlanName: settings.planName,
    subscriptionYearlyPrice: settings.yearlyPrice,
    subscriptionStartedAt: toMysqlDate(startedAt),
    subscriptionExpiresAt: toMysqlDate(expiresAt),
    subscriptionRazorpayOrderId: orderId,
    subscriptionRazorpayPaymentId: paymentId,
  };

  if (signature) {
    updates.subscriptionRazorpaySignature = signature;
  }

  await updateDealerSubscriptionById(dealer.id, updates);
  return true;
}

async function createSubscriptionOrder({ dealerId, mobile }) {
  await ensureSubscriptionTable();

  const dealer = await findDealerById(dealerId);
  if (!dealer) {
    const error = new Error("Dealer not found");
    error.statusCode = 404;
    throw error;
  }

  if (mobile && String(dealer.mobile || "") !== String(mobile || "")) {
    const error = new Error("Dealer mobile does not match");
    error.statusCode = 400;
    throw error;
  }

  const settings = await getSubscriptionSettings();
  const amountPaise = Number(settings.yearlyPrice || 0) * 100;

  if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
    const error = new Error("Subscription price is not configured");
    error.statusCode = 400;
    throw error;
  }

  const receipt = `kyfi-sub-${dealer.id}-${Date.now()}`;
  const order = await createRazorpayOrder(amountPaise, receipt, {
    dealerId: String(dealer.id),
    mobile: String(dealer.mobile || ""),
    planName: settings.planName,
  });

  await updateDealerSubscriptionById(dealer.id, {
    subscriptionStatus: "inactive",
    subscriptionPlanName: settings.planName,
    subscriptionYearlyPrice: settings.yearlyPrice,
    subscriptionRazorpayOrderId: order.id,
    subscriptionRazorpayPaymentId: null,
    subscriptionRazorpaySignature: null,
  });

  return {
    keyId: process.env.RAZORPAY_KEY_ID || "",
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    receipt: order.receipt,
    dealerId: dealer.id,
    dealerName: dealer.name,
    mobile: dealer.mobile,
    planName: settings.planName,
    yearlyPrice: settings.yearlyPrice,
    durationLabel: settings.durationLabel,
  };
}

async function verifySubscriptionPayment({
  dealerId,
  mobile,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) {
  await ensureSubscriptionTable();

  const dealer = await findDealerById(dealerId);
  if (!dealer) {
    const error = new Error("Dealer not found");
    error.statusCode = 404;
    throw error;
  }

  if (mobile && String(dealer.mobile || "") !== String(mobile || "")) {
    const error = new Error("Dealer mobile does not match");
    error.statusCode = 400;
    throw error;
  }

  if (!dealer.subscription_razorpay_order_id || dealer.subscription_razorpay_order_id !== razorpayOrderId) {
    const error = new Error("Verification failed");
    error.statusCode = 400;
    throw error;
  }

  if (!verifyRazorpaySignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  })) {
    const error = new Error("Payment verification failed");
    error.statusCode = 400;
    throw error;
  }

  await activateDealerSubscription({
    dealer,
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });

  const updatedDealer = await findDealerById(dealer.id);

  return {
    message: "Subscription payment verified successfully",
    dealer: updatedDealer,
  };
}

async function processRazorpayWebhook({ rawBody, signature, eventId }) {
  if (!Buffer.isBuffer(rawBody) || !rawBody.length) {
    const error = new Error("Webhook body is required");
    error.statusCode = 400;
    throw error;
  }

  if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
    const error = new Error("Invalid Razorpay webhook signature");
    error.statusCode = 400;
    throw error;
  }

  let webhook;
  try {
    webhook = JSON.parse(rawBody.toString("utf8"));
  } catch {
    const error = new Error("Invalid Razorpay webhook payload");
    error.statusCode = 400;
    throw error;
  }

  const resolvedEventId = String(eventId || "").trim() || crypto.createHash("sha256").update(rawBody).digest("hex");
  const eventType = String(webhook?.event || "").trim();
  const payment = webhook?.payload?.payment?.entity || null;
  const orderId = String(payment?.order_id || webhook?.payload?.order?.entity?.id || "").trim();
  const paymentId = String(payment?.id || "").trim();

  await ensureWebhookEventsTable();

  const [existingRows] = await db.execute(
    `SELECT processing_status FROM ${WEBHOOK_EVENTS_TABLE} WHERE event_id = ? LIMIT 1`,
    [resolvedEventId],
  );

  if (existingRows[0]?.processing_status === "processed" || existingRows[0]?.processing_status === "ignored") {
    return { duplicate: true, eventType };
  }

  await db.execute(
    `INSERT INTO ${WEBHOOK_EVENTS_TABLE}
      (event_id, event_type, razorpay_order_id, razorpay_payment_id, processing_status)
     VALUES (?, ?, ?, ?, 'processing')
     ON DUPLICATE KEY UPDATE
       event_type = VALUES(event_type),
       razorpay_order_id = VALUES(razorpay_order_id),
       razorpay_payment_id = VALUES(razorpay_payment_id),
       processing_status = 'processing',
       attempt_count = attempt_count + 1,
       error_message = NULL`,
    [resolvedEventId, eventType || "unknown", orderId || null, paymentId || null],
  );

  if (!new Set(["payment.captured", "order.paid"]).has(eventType)) {
    await db.execute(
      `UPDATE ${WEBHOOK_EVENTS_TABLE}
       SET processing_status = 'ignored', processed_at = NOW()
       WHERE event_id = ?`,
      [resolvedEventId],
    );
    return { ignored: true, eventType };
  }

  try {
    if (!orderId || !paymentId) {
      const error = new Error("Razorpay order or payment ID is missing");
      error.statusCode = 400;
      throw error;
    }

    const dealer = await findDealerBySubscriptionOrderId(orderId);
    if (!dealer) {
      const error = new Error("Dealer subscription order not found");
      error.statusCode = 404;
      throw error;
    }

    const expectedAmount = Math.round(Number(dealer.subscription_yearly_price || 0) * 100);
    const receivedAmount = Number(payment?.amount || 0);
    const currency = String(payment?.currency || "").toUpperCase();

    if (!expectedAmount || receivedAmount !== expectedAmount || currency !== "INR") {
      const error = new Error("Razorpay payment amount or currency does not match the subscription order");
      error.statusCode = 400;
      throw error;
    }

    const activated = await activateDealerSubscription({
      dealer,
      orderId,
      paymentId,
    });

    await db.execute(
      `UPDATE ${WEBHOOK_EVENTS_TABLE}
       SET processing_status = 'processed', processed_at = NOW()
       WHERE event_id = ?`,
      [resolvedEventId],
    );

    return { eventType, activated, dealerId: dealer.id };
  } catch (error) {
    await db.execute(
      `UPDATE ${WEBHOOK_EVENTS_TABLE}
       SET processing_status = 'failed', error_message = ?
       WHERE event_id = ?`,
      [String(error.message || "Webhook processing failed").slice(0, 500), resolvedEventId],
    );
    throw error;
  }
}

module.exports = {
  getSubscriptionSettings,
  updateSubscriptionSettings,
  createSubscriptionOrder,
  verifySubscriptionPayment,
  processRazorpayWebhook,
};
