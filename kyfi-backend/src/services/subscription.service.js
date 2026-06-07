const crypto = require("crypto");
const db = require("../config/db");
const { findDealerById, updateDealerSubscriptionById } = require("./dealer.service");

const TABLE_NAME = "subscription_settings";

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

  const settings = await getSubscriptionSettings();

  await updateDealerSubscriptionById(dealer.id, {
    subscriptionStatus: "active",
    subscriptionPlanName: settings.planName,
    subscriptionYearlyPrice: settings.yearlyPrice,
    subscriptionStartedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
    subscriptionExpiresAt: new Date(
      Date.now() + 365 * 24 * 60 * 60 * 1000,
    )
      .toISOString()
      .slice(0, 19)
      .replace("T", " "),
    subscriptionRazorpayOrderId: razorpayOrderId,
    subscriptionRazorpayPaymentId: razorpayPaymentId,
    subscriptionRazorpaySignature: razorpaySignature,
  });

  const updatedDealer = await findDealerById(dealer.id);

  return {
    message: "Subscription payment verified successfully",
    dealer: updatedDealer,
  };
}

module.exports = {
  getSubscriptionSettings,
  updateSubscriptionSettings,
  createSubscriptionOrder,
  verifySubscriptionPayment,
};
