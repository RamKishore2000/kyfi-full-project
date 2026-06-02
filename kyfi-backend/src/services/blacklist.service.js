const db = require("../config/db");

const normalizeDigits = (value) => String(value || "").replace(/\D/g, "");

const maskNumber = (value) => {
  const digits = normalizeDigits(value);
  return digits.length >= 4 ? `XXXX XXXX ${digits.slice(-4)}` : "XXXX XXXX XXXX";
};

const columnExists = async (tableName, columnName) => {
  const [rows] = await db.execute(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [tableName, columnName],
  );

  return Number(rows[0]?.count || 0) > 0;
};

const indexExists = async (tableName, indexName) => {
  const [rows] = await db.execute(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND INDEX_NAME = ?`,
    [tableName, indexName],
  );

  return Number(rows[0]?.count || 0) > 0;
};

const ensureBlacklistSchema = async () => {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS blacklist_entries (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      aadhaar VARCHAR(16) DEFAULT NULL,
      mobile_number VARCHAR(20) DEFAULT NULL,
      farmer_name VARCHAR(150) NOT NULL,
      district VARCHAR(100) DEFAULT NULL,
      mandal VARCHAR(100) NOT NULL,
      village VARCHAR(100) NOT NULL,
      reason VARCHAR(255) NOT NULL,
      address VARCHAR(255) DEFAULT NULL,
      created_by_dealer_id BIGINT UNSIGNED NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_blacklist_aadhaar (aadhaar),
      UNIQUE KEY uq_blacklist_mobile (mobile_number),
      KEY idx_blacklist_location (district, mandal, village),
      CONSTRAINT fk_blacklist_created_by FOREIGN KEY (created_by_dealer_id) REFERENCES dealers(id)
    )`,
  );

  const hasMobileNumber = await columnExists("blacklist_entries", "mobile_number");
  if (!hasMobileNumber) {
    await db.execute(
      "ALTER TABLE blacklist_entries ADD COLUMN mobile_number VARCHAR(20) DEFAULT NULL AFTER aadhaar",
    );
  }

  const hasNullableAadhaar = await db.execute(
    `SELECT IS_NULLABLE
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'blacklist_entries'
       AND COLUMN_NAME = 'aadhaar'
     LIMIT 1`,
  );

  if (String(hasNullableAadhaar[0]?.[0]?.IS_NULLABLE || "").toUpperCase() === "NO") {
    await db.execute("ALTER TABLE blacklist_entries MODIFY aadhaar VARCHAR(16) DEFAULT NULL");
  }

  const hasNullableDistrict = await db.execute(
    `SELECT IS_NULLABLE
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'blacklist_entries'
       AND COLUMN_NAME = 'district'
     LIMIT 1`,
  );

  if (String(hasNullableDistrict[0]?.[0]?.IS_NULLABLE || "").toUpperCase() === "NO") {
    await db.execute("ALTER TABLE blacklist_entries MODIFY district VARCHAR(100) DEFAULT NULL");
  }

  const hasMobileUnique = await indexExists("blacklist_entries", "uq_blacklist_mobile");
  if (!hasMobileUnique) {
    await db.execute("CREATE UNIQUE INDEX uq_blacklist_mobile ON blacklist_entries (mobile_number)");
  }
};

const serializeBlacklistEntry = (entry) => ({
  id: entry.id,
  aadhaar: normalizeDigits(entry.aadhaar).length === 12 ? normalizeDigits(entry.aadhaar) : null,
  aadhaarMasked: normalizeDigits(entry.aadhaar).length === 12 ? maskNumber(entry.aadhaar) : null,
  mobileNumber: entry.mobile_number || null,
  mobileMasked: null,
  farmerName: entry.farmer_name,
  district: entry.district || null,
  mandal: entry.mandal,
  village: entry.village,
  reason: entry.reason,
  address: entry.address,
  createdByDealerId: entry.created_by_dealer_id,
  createdAt: entry.created_at,
  updatedAt: entry.updated_at,
  reportCount: Number(entry.report_count || 0),
  currentDealerReported: Boolean(entry.current_dealer_reported),
});

const findBlacklistEntryByAadhaar = async (aadhaar) => {
  await ensureBlacklistSchema();
  const normalizedAadhaar = normalizeDigits(aadhaar);

  if (!normalizedAadhaar) {
    return null;
  }

  const [rows] = await db.execute(
    `SELECT
      id,
      aadhaar,
      mobile_number,
      farmer_name,
      district,
      mandal,
      village,
      reason,
      address,
      created_by_dealer_id,
      created_at,
      updated_at
     FROM blacklist_entries
     WHERE aadhaar = ?
     ORDER BY created_at DESC
     LIMIT 1`,
    [normalizedAadhaar],
  );

  return rows[0] || null;
};

const findBlacklistEntryByMobileNumber = async (mobileNumber) => {
  await ensureBlacklistSchema();
  const normalizedMobileNumber = normalizeDigits(mobileNumber);

  if (!normalizedMobileNumber) {
    return null;
  }

  const [rows] = await db.execute(
    `SELECT
      id,
      aadhaar,
      mobile_number,
      farmer_name,
      district,
      mandal,
      village,
      reason,
      address,
      created_by_dealer_id,
      created_at,
      updated_at
     FROM blacklist_entries
     WHERE mobile_number = ?
     ORDER BY created_at DESC
     LIMIT 1`,
    [normalizedMobileNumber],
  );

  return rows[0] || null;
};

const findBlacklistEntryById = async (entryId) => {
  await ensureBlacklistSchema();
  const [rows] = await db.execute(
    `SELECT
      id,
      aadhaar,
      mobile_number,
      farmer_name,
      district,
      mandal,
      village,
      reason,
      address,
      created_by_dealer_id,
      created_at,
      updated_at
     FROM blacklist_entries
     WHERE id = ?
     LIMIT 1`,
    [entryId],
  );

  return rows[0] || null;
};

const getBlacklistEntryReportStats = async ({ blacklistEntryId, dealerId }) => {
  await ensureBlacklistSchema();
  const [countRows] = await db.execute(
    "SELECT COUNT(*) AS report_count FROM blacklist_reports WHERE blacklist_entry_id = ?",
    [blacklistEntryId],
  );

  let currentDealerReported = false;

  if (dealerId) {
    const [dealerRows] = await db.execute(
      "SELECT 1 AS reported FROM blacklist_reports WHERE blacklist_entry_id = ? AND dealer_id = ? LIMIT 1",
      [blacklistEntryId, dealerId],
    );

    currentDealerReported = Boolean(dealerRows[0]);
  }

  return {
    reportCount: Number(countRows[0]?.report_count || 0),
    currentDealerReported,
  };
};

const searchBlacklistEntries = async ({ mandal, village }) => {
  await ensureBlacklistSchema();
  const conditions = [];
  const params = [];

  if (mandal) {
    conditions.push("LOWER(mandal) LIKE LOWER(?)");
    params.push(`%${String(mandal).trim()}%`);
  }

  if (village) {
    conditions.push("LOWER(village) LIKE LOWER(?)");
    params.push(`%${String(village).trim()}%`);
  }

  conditions.push(
    `EXISTS (
      SELECT 1
      FROM blacklist_reports br
      WHERE br.blacklist_entry_id = blacklist_entries.id
    )`,
  );

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await db.execute(
    `SELECT
      id,
      aadhaar,
      mobile_number,
      farmer_name,
      district,
      mandal,
      village,
      reason,
      address,
      created_by_dealer_id,
      created_at,
      updated_at
     FROM blacklist_entries
     ${whereClause}
     ORDER BY created_at DESC`,
    params,
  );

  return rows;
};

const createBlacklistEntry = async ({
  aadhaar,
  mobileNumber,
  farmerName,
  district,
  mandal,
  village,
  reason,
  address,
  createdByDealerId,
}) => {
  await ensureBlacklistSchema();
  const normalizedAadhaar = normalizeDigits(aadhaar);
  const normalizedMobileNumber = normalizeDigits(mobileNumber);

  const [result] = await db.execute(
    `INSERT INTO blacklist_entries
      (aadhaar, mobile_number, farmer_name, district, mandal, village, reason, address, created_by_dealer_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      normalizedAadhaar || null,
      normalizedMobileNumber || null,
      farmerName,
      district || null,
      mandal,
      village,
      reason,
      address || null,
      createdByDealerId,
    ],
  );

  return {
    id: result.insertId,
    aadhaar: normalizedAadhaar || null,
    mobileNumber: normalizedMobileNumber || null,
    farmerName,
    district: district || null,
    mandal,
    village,
    reason,
    address: address || null,
    createdByDealerId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

const createBlacklistReport = async ({ blacklistEntryId, dealerId }) => {
  const [result] = await db.execute(
    `INSERT INTO blacklist_reports (blacklist_entry_id, dealer_id)
     VALUES (?, ?)`,
    [blacklistEntryId, dealerId],
  );

  return result.insertId;
};

const deleteBlacklistReport = async ({ blacklistEntryId, dealerId }) => {
  const [result] = await db.execute(
    `DELETE FROM blacklist_reports
     WHERE blacklist_entry_id = ?
       AND dealer_id = ?`,
    [blacklistEntryId, dealerId],
  );

  return Number(result.affectedRows || 0) > 0;
};

const deleteBlacklistEntryById = async (entryId) => {
  const [result] = await db.execute(
    `DELETE FROM blacklist_entries
     WHERE id = ?`,
    [entryId],
  );

  return Number(result.affectedRows || 0) > 0;
};

module.exports = {
  createBlacklistEntry,
  createBlacklistReport,
  deleteBlacklistReport,
  deleteBlacklistEntryById,
  findBlacklistEntryById,
  findBlacklistEntryByAadhaar,
  findBlacklistEntryByMobileNumber,
  getBlacklistEntryReportStats,
  searchBlacklistEntries,
  serializeBlacklistEntry,
};
