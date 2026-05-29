const db = require("../config/db");

const normalizeDigits = (value) => String(value || "").replace(/\D/g, "");

const maskAadhaar = (aadhaar) => {
  const digits = normalizeDigits(aadhaar);
  return digits.length >= 4 ? `XXXX XXXX ${digits.slice(-4)}` : "XXXX XXXX XXXX";
};

const serializeBlacklistEntry = (entry) => ({
  id: entry.id,
  aadhaar: entry.aadhaar,
  aadhaarMasked: maskAadhaar(entry.aadhaar),
  farmerName: entry.farmer_name,
  district: entry.district,
  mandal: entry.mandal,
  village: entry.village,
  reason: entry.reason,
  address: entry.address,
  createdByDealerId: entry.created_by_dealer_id,
  createdAt: entry.created_at,
  updatedAt: entry.updated_at,
});

const findBlacklistEntryByAadhaar = async (aadhaar) => {
  const normalizedAadhaar = normalizeDigits(aadhaar);

  if (!normalizedAadhaar) {
    return null;
  }

  const [rows] = await db.execute(
    `SELECT
      id,
      aadhaar,
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

const searchBlacklistEntries = async ({ mandal, village }) => {
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

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await db.execute(
    `SELECT
      id,
      aadhaar,
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
  farmerName,
  district,
  mandal,
  village,
  reason,
  address,
  createdByDealerId,
}) => {
  const normalizedAadhaar = normalizeDigits(aadhaar);

  const [result] = await db.execute(
    `INSERT INTO blacklist_entries
      (aadhaar, farmer_name, district, mandal, village, reason, address, created_by_dealer_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      normalizedAadhaar,
      farmerName,
      district,
      mandal,
      village,
      reason,
      address || null,
      createdByDealerId,
    ],
  );

  return {
    id: result.insertId,
    aadhaar: normalizedAadhaar,
    farmerName,
    district,
    mandal,
    village,
    reason,
    address: address || null,
    createdByDealerId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

module.exports = {
  createBlacklistEntry,
  findBlacklistEntryByAadhaar,
  searchBlacklistEntries,
  serializeBlacklistEntry,
};
