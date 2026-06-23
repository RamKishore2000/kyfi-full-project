const bcrypt = require("bcrypt");
const db = require("../config/db");

function parseMysqlUtcDate(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  const normalized = String(value).trim().replace(" ", "T");
  return new Date(/[zZ]|[+-]\d{2}:\d{2}$/.test(normalized) ? normalized : `${normalized}Z`);
}

function formatMysqlDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 19).replace("T", " ");
}

async function hasDealerColumn(columnName) {
  const [rows] = await db.execute(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'dealers'
       AND COLUMN_NAME = ?`,
    [columnName],
  );

  return Number(rows[0]?.count || 0) > 0;
}

async function ensureSubscriptionSettingsTrialColumn() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS subscription_settings (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      plan_name VARCHAR(150) NOT NULL DEFAULT 'One Year Plan',
      yearly_price DECIMAL(10,2) NOT NULL DEFAULT 1999.00,
      currency VARCHAR(10) NOT NULL DEFAULT 'INR',
      duration_label VARCHAR(50) NOT NULL DEFAULT '1 Year',
      free_trial_days INT UNSIGNED NOT NULL DEFAULT 0,
      updated_by_admin_id BIGINT UNSIGNED DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    )
  `);

  await db.execute("INSERT IGNORE INTO subscription_settings (id) VALUES (1)");

  const [columns] = await db.execute(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'subscription_settings'
       AND COLUMN_NAME = 'free_trial_days'`,
  );

  if (Number(columns[0]?.count || 0) === 0) {
    await db.execute(
      "ALTER TABLE subscription_settings ADD COLUMN free_trial_days INT UNSIGNED NOT NULL DEFAULT 0 AFTER duration_label",
    );
  }
}

async function getConfiguredFreeTrialDays() {
  await ensureSubscriptionSettingsTrialColumn();
  const [rows] = await db.execute(
    "SELECT free_trial_days FROM subscription_settings WHERE id = 1 LIMIT 1",
  );

  return Math.max(0, Number(rows[0]?.free_trial_days || 0));
}

async function ensureDealerColumns() {
  const columnStatements = [
    {
      name: "language_preference",
      sql: "ALTER TABLE dealers ADD COLUMN language_preference VARCHAR(10) NOT NULL DEFAULT 'en'",
    },
    {
      name: "aadhaar_number",
      sql: "ALTER TABLE dealers ADD COLUMN aadhaar_number VARCHAR(12) DEFAULT NULL AFTER village",
    },
    {
      name: "gst_number",
      sql: "ALTER TABLE dealers ADD COLUMN gst_number VARCHAR(15) DEFAULT NULL AFTER aadhaar_number",
    },
    {
      name: "subscription_status",
      sql: "ALTER TABLE dealers ADD COLUMN subscription_status ENUM('inactive', 'active') NOT NULL DEFAULT 'inactive'",
    },
    {
      name: "subscription_plan_name",
      sql: "ALTER TABLE dealers ADD COLUMN subscription_plan_name VARCHAR(150) DEFAULT NULL",
    },
    {
      name: "subscription_yearly_price",
      sql: "ALTER TABLE dealers ADD COLUMN subscription_yearly_price DECIMAL(10,2) DEFAULT NULL",
    },
    {
      name: "subscription_started_at",
      sql: "ALTER TABLE dealers ADD COLUMN subscription_started_at DATETIME DEFAULT NULL",
    },
    {
      name: "subscription_expires_at",
      sql: "ALTER TABLE dealers ADD COLUMN subscription_expires_at DATETIME DEFAULT NULL",
    },
    {
      name: "subscription_razorpay_order_id",
      sql: "ALTER TABLE dealers ADD COLUMN subscription_razorpay_order_id VARCHAR(100) DEFAULT NULL",
    },
    {
      name: "subscription_razorpay_payment_id",
      sql: "ALTER TABLE dealers ADD COLUMN subscription_razorpay_payment_id VARCHAR(100) DEFAULT NULL",
    },
    {
      name: "subscription_razorpay_signature",
      sql: "ALTER TABLE dealers ADD COLUMN subscription_razorpay_signature VARCHAR(255) DEFAULT NULL",
    },
    {
      name: "trial_status",
      sql: "ALTER TABLE dealers ADD COLUMN trial_status ENUM('inactive', 'active', 'expired') NOT NULL DEFAULT 'inactive'",
    },
    {
      name: "trial_started_at",
      sql: "ALTER TABLE dealers ADD COLUMN trial_started_at DATETIME DEFAULT NULL",
    },
    {
      name: "trial_expires_at",
      sql: "ALTER TABLE dealers ADD COLUMN trial_expires_at DATETIME DEFAULT NULL",
    },
  ];

  for (const column of columnStatements) {
    const exists = await hasDealerColumn(column.name);
    if (!exists) {
      await db.execute(column.sql);
    }
  }
}

function mapDealerRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    role: row.role,
    name: row.name,
    mobile: row.mobile,
    password_hash: row.password_hash,
    shop_name: row.shop_name,
    district: row.district,
    state: row.state,
    mandal: row.mandal,
    village: row.village,
    aadhaar_number: row.aadhaar_number,
    gst_number: row.gst_number,
    aadhaar_or_gst_number: row.aadhaar_or_gst_number,
    status: row.status,
    otp_code: row.otp_code,
    language_preference: row.language_preference,
    subscription_status: row.subscription_status || "inactive",
    subscription_plan_name: row.subscription_plan_name || null,
    subscription_yearly_price:
      row.subscription_yearly_price !== null && row.subscription_yearly_price !== undefined
        ? Number(row.subscription_yearly_price)
        : null,
    subscription_started_at: row.subscription_started_at || null,
    subscription_expires_at: row.subscription_expires_at || null,
    subscription_razorpay_order_id: row.subscription_razorpay_order_id || null,
    subscription_razorpay_payment_id: row.subscription_razorpay_payment_id || null,
    subscription_razorpay_signature: row.subscription_razorpay_signature || null,
    trial_status: row.trial_status || "inactive",
    trial_started_at: row.trial_started_at || null,
    trial_expires_at: row.trial_expires_at || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function getDealerAccessState(dealer) {
  if (!dealer || dealer.role !== "dealer") {
    return {
      accessStatus: "allowed",
      subscriptionActive: false,
      trialActive: false,
      trialDaysRemaining: null,
    };
  }

  const now = Date.now();
  const subscriptionExpiresAt = parseMysqlUtcDate(dealer.subscription_expires_at);
  const trialExpiresAt = parseMysqlUtcDate(dealer.trial_expires_at);
  const subscriptionActive =
    dealer.subscription_status === "active" &&
    subscriptionExpiresAt instanceof Date &&
    !Number.isNaN(subscriptionExpiresAt.getTime()) &&
    subscriptionExpiresAt.getTime() > now;
  const trialActive =
    dealer.trial_status === "active" &&
    trialExpiresAt instanceof Date &&
    !Number.isNaN(trialExpiresAt.getTime()) &&
    trialExpiresAt.getTime() > now;
  const trialDaysRemaining = trialActive
    ? Math.max(0, Math.ceil((trialExpiresAt.getTime() - now) / (24 * 60 * 60 * 1000)))
    : 0;

  return {
    accessStatus: subscriptionActive || trialActive ? "allowed" : "subscription_required",
    subscriptionActive,
    trialActive,
    trialDaysRemaining,
  };
}

const findDealerByMobile = async (mobile) => {
  await ensureDealerColumns();
  const [rows] = await db.execute(
    `SELECT id, role, name, mobile, password_hash, shop_name, district, state, mandal, village,
            aadhaar_number, gst_number, aadhaar_or_gst_number, status, otp_code, language_preference,
            subscription_status, subscription_plan_name, subscription_yearly_price,
            subscription_started_at, subscription_expires_at, subscription_razorpay_order_id,
            subscription_razorpay_payment_id, subscription_razorpay_signature,
            trial_status, trial_started_at, trial_expires_at,
            created_at, updated_at
     FROM dealers WHERE mobile = ? LIMIT 1`,
    [mobile],
  );

  return mapDealerRow(rows[0] || null);
};

const findDealerById = async (dealerId) => {
  await ensureDealerColumns();
  const [rows] = await db.execute(
    `SELECT id, role, name, mobile, password_hash, shop_name, district, state, mandal, village,
            aadhaar_number, gst_number, aadhaar_or_gst_number, status, otp_code, language_preference,
            subscription_status, subscription_plan_name, subscription_yearly_price,
            subscription_started_at, subscription_expires_at, subscription_razorpay_order_id,
            subscription_razorpay_payment_id, subscription_razorpay_signature,
            trial_status, trial_started_at, trial_expires_at,
            created_at, updated_at
     FROM dealers WHERE id = ? LIMIT 1`,
    [dealerId],
  );

  return mapDealerRow(rows[0] || null);
};

const findDealerBySubscriptionOrderId = async (orderId) => {
  await ensureDealerColumns();
  const [rows] = await db.execute(
    `SELECT id, role, name, mobile, password_hash, shop_name, district, state, mandal, village,
            aadhaar_number, gst_number, aadhaar_or_gst_number, status, otp_code, language_preference,
            subscription_status, subscription_plan_name, subscription_yearly_price,
            subscription_started_at, subscription_expires_at, subscription_razorpay_order_id,
            subscription_razorpay_payment_id, subscription_razorpay_signature,
            trial_status, trial_started_at, trial_expires_at,
            created_at, updated_at
     FROM dealers WHERE subscription_razorpay_order_id = ? LIMIT 1`,
    [orderId],
  );

  return mapDealerRow(rows[0] || null);
};

const createDealer = async ({
  role,
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
  status,
}) => {
  await ensureDealerColumns();
  const passwordHash = password ? await bcrypt.hash(password, 10) : null;
  const normalizedAadhaar = String(aadhaarNumber || "").trim();
  const normalizedGst = String(gstNumber || "").trim().toUpperCase();
  const legacyIdentifier = String(aadhaarOrGstNumber || "").trim().toUpperCase();
  const resolvedAadhaar =
    normalizedAadhaar ||
    (/^\d{12}$/.test(legacyIdentifier) ? legacyIdentifier : "");
  const resolvedGst =
    normalizedGst ||
    (/^\d{2}[A-Z0-9]{13}$/.test(legacyIdentifier) ? legacyIdentifier : "");
  const combinedIdentifier = [resolvedAadhaar, resolvedGst].filter(Boolean).join(" / ") || legacyIdentifier;
  const freeTrialDays = role === "dealer" ? await getConfiguredFreeTrialDays() : 0;
  const trialStartedAt = freeTrialDays > 0 ? new Date() : null;
  const trialExpiresAt = trialStartedAt
    ? new Date(trialStartedAt.getTime() + freeTrialDays * 24 * 60 * 60 * 1000)
    : null;
  const trialStatus = trialExpiresAt ? "active" : "inactive";

  const [result] = await db.execute(
    `INSERT INTO dealers
      (role, name, mobile, password_hash, shop_name, district, state, mandal, village, aadhaar_number, gst_number, aadhaar_or_gst_number,
       status, language_preference, subscription_status, subscription_plan_name, subscription_yearly_price,
       subscription_started_at, subscription_expires_at, subscription_razorpay_order_id,
       subscription_razorpay_payment_id, subscription_razorpay_signature, trial_status, trial_started_at, trial_expires_at, otp_code)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'en', 'inactive', NULL, NULL, NULL, NULL, NULL, NULL, NULL, ?, ?, ?, NULL)`,
    [
      role,
      name,
      mobile,
      passwordHash,
      shopName,
      district,
      state,
      mandal,
      village,
      resolvedAadhaar || null,
      resolvedGst || null,
      combinedIdentifier || null,
      status,
      trialStatus,
      formatMysqlDate(trialStartedAt),
      formatMysqlDate(trialExpiresAt),
    ],
  );

  return {
    id: result.insertId,
    role,
    name,
    mobile,
    passwordHash,
    shopName,
    district,
    state,
    mandal,
    village,
    aadhaarNumber: resolvedAadhaar || null,
    gstNumber: resolvedGst || null,
    aadhaarOrGstNumber: combinedIdentifier || null,
    status,
    languagePreference: "en",
    subscriptionStatus: "inactive",
    subscriptionPlanName: null,
    subscriptionYearlyPrice: null,
    subscriptionStartedAt: null,
    subscriptionExpiresAt: null,
    trialStatus,
    trialStartedAt,
    trialExpiresAt,
  };
};

const updateDealerProfileById = async (dealerId, updates) => {
  await ensureDealerColumns();
  const fields = [];
  const values = [];

  const pushField = (column, value) => {
    if (value === undefined || value === null) return;
    fields.push(`${column} = ?`);
    values.push(value);
  };

  pushField("name", updates.name);
  pushField("mobile", updates.mobile);
  pushField("shop_name", updates.shopName);
  pushField("district", updates.district);
  pushField("state", updates.state);
  pushField("mandal", updates.mandal);
  pushField("village", updates.village);
  pushField("language_preference", updates.languagePreference);

  if (!fields.length) {
    return false;
  }

  values.push(dealerId);

  const [result] = await db.execute(`UPDATE dealers SET ${fields.join(", ")} WHERE id = ?`, values);

  return result.affectedRows > 0;
};

const updateDealerPasswordById = async (dealerId, password) => {
  await ensureDealerColumns();
  const passwordHash = password ? await bcrypt.hash(password, 10) : null;
  const [result] = await db.execute("UPDATE dealers SET password_hash = ? WHERE id = ?", [
    passwordHash,
    dealerId,
  ]);

  return result.affectedRows > 0;
};

const updateDealerSettingsById = async (dealerId, updates) => {
  await ensureDealerColumns();
  const fields = [];
  const values = [];

  if (updates.languagePreference) {
    fields.push("language_preference = ?");
    values.push(updates.languagePreference);
  }

  if (!fields.length) {
    return false;
  }

  values.push(dealerId);

  const [result] = await db.execute(`UPDATE dealers SET ${fields.join(", ")} WHERE id = ?`, values);

  return result.affectedRows > 0;
};

const updateDealerSubscriptionById = async (dealerId, updates) => {
  await ensureDealerColumns();
  const fields = [];
  const values = [];

  const pushField = (column, value) => {
    if (value === undefined) return;
    fields.push(`${column} = ?`);
    values.push(value);
  };

  pushField("subscription_status", updates.subscriptionStatus);
  pushField("subscription_plan_name", updates.subscriptionPlanName);
  pushField("subscription_yearly_price", updates.subscriptionYearlyPrice);
  pushField("subscription_started_at", updates.subscriptionStartedAt);
  pushField("subscription_expires_at", updates.subscriptionExpiresAt);
  pushField("subscription_razorpay_order_id", updates.subscriptionRazorpayOrderId);
  pushField("subscription_razorpay_payment_id", updates.subscriptionRazorpayPaymentId);
  pushField("subscription_razorpay_signature", updates.subscriptionRazorpaySignature);
  pushField("trial_status", updates.trialStatus);
  pushField("trial_started_at", updates.trialStartedAt);
  pushField("trial_expires_at", updates.trialExpiresAt);

  if (!fields.length) {
    return false;
  }

  values.push(dealerId);

  const [result] = await db.execute(`UPDATE dealers SET ${fields.join(", ")} WHERE id = ?`, values);
  return result.affectedRows > 0;
};

const normalizeDealerSubscription = async (dealer) => {
  if (!dealer || dealer.role !== "dealer") {
    return dealer;
  }

  const normalizedDealer = { ...dealer };
  const status = String(normalizedDealer.subscription_status || "inactive").toLowerCase();

  if (status === "active") {
    const expiresAt = parseMysqlUtcDate(normalizedDealer.subscription_expires_at);
    const hasValidExpiry =
      expiresAt &&
      !Number.isNaN(expiresAt.getTime()) &&
      expiresAt.getTime() > Date.now();

    if (!hasValidExpiry) {
      await updateDealerSubscriptionById(dealer.id, {
        subscriptionStatus: "inactive",
      });

      normalizedDealer.subscription_status = "inactive";
    }
  }

  const trialStatus = String(normalizedDealer.trial_status || "inactive").toLowerCase();
  if (trialStatus === "active") {
    const trialExpiresAt = parseMysqlUtcDate(normalizedDealer.trial_expires_at);
    const hasValidTrial =
      trialExpiresAt &&
      !Number.isNaN(trialExpiresAt.getTime()) &&
      trialExpiresAt.getTime() > Date.now();

    if (!hasValidTrial) {
      await updateDealerSubscriptionById(dealer.id, {
        trialStatus: "expired",
      });

      normalizedDealer.trial_status = "expired";
    }
  }

  return normalizedDealer;
};

const findDealerByIdWithSubscriptionCheck = async (dealerId) => {
  const dealer = await findDealerById(dealerId);
  return normalizeDealerSubscription(dealer);
};

const listDealers = async () => {
  await ensureDealerColumns();
  const [rows] = await db.execute(
    "SELECT id, role, name, mobile, shop_name, district, state, mandal, village, aadhaar_or_gst_number, status, subscription_status, subscription_plan_name, subscription_yearly_price, subscription_started_at, subscription_expires_at, trial_status, trial_started_at, trial_expires_at, created_at, updated_at FROM dealers WHERE role = 'dealer' ORDER BY created_at DESC",
  );

  return rows.map(mapDealerRow);
};

const updateDealerStatusById = async (dealerId, status) => {
  await ensureDealerColumns();
  const [result] = await db.execute(
    "UPDATE dealers SET status = ? WHERE id = ? AND role = 'dealer'",
    [status, dealerId],
  );

  return result.affectedRows > 0;
};

module.exports = {
  findDealerById,
  findDealerBySubscriptionOrderId,
  findDealerByMobile,
  createDealer,
  updateDealerPasswordById,
  updateDealerProfileById,
  updateDealerSettingsById,
  updateDealerSubscriptionById,
  normalizeDealerSubscription,
  getDealerAccessState,
  findDealerByIdWithSubscriptionCheck,
  listDealers,
  updateDealerStatusById,
};
