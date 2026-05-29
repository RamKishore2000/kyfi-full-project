const bcrypt = require("bcrypt");
const db = require("../config/db");

const ensureDealerLanguagePreferenceColumn = async () => {
  const [rows] = await db.execute(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'dealers'
       AND COLUMN_NAME = 'language_preference'`,
  );

  if (rows[0] && Number(rows[0].count) > 0) {
    return;
  }

  await db.execute(
    "ALTER TABLE dealers ADD COLUMN language_preference VARCHAR(10) NOT NULL DEFAULT 'en'",
  );
};

const findDealerByMobile = async (mobile) => {
  await ensureDealerLanguagePreferenceColumn();
  const [rows] = await db.execute(
    "SELECT id, role, name, mobile, password_hash, shop_name, district, state, mandal, village, aadhaar_or_gst_number, status, otp_code, language_preference, created_at, updated_at FROM dealers WHERE mobile = ? LIMIT 1",
    [mobile],
  );

  return rows[0] || null;
};

const findDealerById = async (dealerId) => {
  await ensureDealerLanguagePreferenceColumn();
  const [rows] = await db.execute(
    "SELECT id, role, name, mobile, password_hash, shop_name, district, state, mandal, village, aadhaar_or_gst_number, status, otp_code, language_preference, created_at, updated_at FROM dealers WHERE id = ? LIMIT 1",
    [dealerId],
  );

  return rows[0] || null;
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
  aadhaarOrGstNumber,
  status,
}) => {
  await ensureDealerLanguagePreferenceColumn();
  const passwordHash = password ? await bcrypt.hash(password, 10) : null;

  const [result] = await db.execute(
    `INSERT INTO dealers
      (role, name, mobile, password_hash, shop_name, district, state, mandal, village, aadhaar_or_gst_number, status, language_preference, otp_code)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'en', NULL)`,
    [role, name, mobile, passwordHash, shopName, district, state, mandal, village, aadhaarOrGstNumber, status],
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
    aadhaarOrGstNumber,
    status,
    languagePreference: "en",
  };
};

const updateDealerProfileById = async (dealerId, updates) => {
  await ensureDealerLanguagePreferenceColumn();
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

  const [result] = await db.execute(
    `UPDATE dealers SET ${fields.join(", ")} WHERE id = ?`,
    values,
  );

  return result.affectedRows > 0;
};

const updateDealerPasswordById = async (dealerId, password) => {
  await ensureDealerLanguagePreferenceColumn();
  const passwordHash = password ? await bcrypt.hash(password, 10) : null;
  const [result] = await db.execute(
    "UPDATE dealers SET password_hash = ? WHERE id = ?",
    [passwordHash, dealerId],
  );

  return result.affectedRows > 0;
};

const updateDealerSettingsById = async (dealerId, updates) => {
  await ensureDealerLanguagePreferenceColumn();
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

  const [result] = await db.execute(
    `UPDATE dealers SET ${fields.join(", ")} WHERE id = ?`,
    values,
  );

  return result.affectedRows > 0;
};

const listDealers = async () => {
  await ensureDealerLanguagePreferenceColumn();
  const [rows] = await db.execute(
    "SELECT id, role, name, mobile, shop_name, district, state, mandal, village, aadhaar_or_gst_number, status, created_at, updated_at FROM dealers WHERE role = 'dealer' ORDER BY created_at DESC",
  );

  return rows;
};

const updateDealerStatusById = async (dealerId, status) => {
  await ensureDealerLanguagePreferenceColumn();
  const [result] = await db.execute(
    "UPDATE dealers SET status = ? WHERE id = ? AND role = 'dealer'",
    [status, dealerId],
  );

  return result.affectedRows > 0;
};

module.exports = {
  findDealerById,
  findDealerByMobile,
  createDealer,
  updateDealerPasswordById,
  updateDealerProfileById,
  updateDealerSettingsById,
  listDealers,
  updateDealerStatusById,
};
