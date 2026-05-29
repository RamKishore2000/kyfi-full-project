const db = require("../config/db");

const normalizeDigits = (value) => String(value || "").replace(/\D/g, "");

const findFarmerStatusByAadhaarOrMobile = async ({ aadhaar, mobileNumber }) => {
  const conditions = [];
  const params = [];

  if (aadhaar) {
    conditions.push("aadhaar = ?");
    params.push(normalizeDigits(aadhaar));
  }

  if (mobileNumber) {
    conditions.push("mobile_number = ?");
    params.push(normalizeDigits(mobileNumber));
  }

  if (!conditions.length) {
    return null;
  }

  const [rows] = await db.execute(
    `SELECT
      id,
      aadhaar,
      farmer_name,
      mobile_number,
      district,
      mandal,
      village,
      status_color,
      ration_card_number,
      address,
      amount_pending,
      remarks,
      created_by_dealer_id,
      vote_count,
      created_at,
      updated_at
     FROM farmer_statuses
     WHERE ${conditions.join(" OR ")}
     ORDER BY created_at DESC
     LIMIT 1`,
    params,
  );

  return rows[0] || null;
};

const searchFarmerStatuses = async ({ term }) => {
  const normalizedTerm = String(term || "").trim();

  if (!normalizedTerm) {
    return [];
  }

  const digitsOnly = normalizedTerm.replace(/\D/g, "");
  const searchTerm = `%${normalizedTerm}%`;
  const searchDigits = digitsOnly ? `%${digitsOnly}%` : null;

  const conditions = ["fs.farmer_name LIKE ?", "fs.district LIKE ?", "fs.mandal LIKE ?", "fs.village LIKE ?"];
  const params = [searchTerm, searchTerm, searchTerm, searchTerm];

  if (searchDigits) {
    conditions.unshift("fs.aadhaar LIKE ?", "fs.mobile_number LIKE ?");
    params.unshift(searchDigits, searchDigits);
  }

  const [rows] = await db.execute(
    `SELECT
      fs.id,
      fs.aadhaar,
      fs.farmer_name,
      fs.mobile_number,
      fs.district,
      fs.mandal,
      fs.village,
      fs.status_color,
      fs.ration_card_number,
      fs.address,
      fs.amount_pending,
      fs.remarks,
      fs.created_by_dealer_id,
      fs.vote_count,
      fs.created_at,
      fs.updated_at,
      b.reason AS blacklist_reason,
      b.id AS blacklist_entry_id
     FROM farmer_statuses fs
     LEFT JOIN blacklist_entries b ON b.aadhaar = fs.aadhaar
     WHERE ${conditions.join(" OR ")}
     ORDER BY fs.created_at DESC
     LIMIT 25`,
    params,
  );

  return rows.map((row) => ({
    ...row,
    blacklisted: Boolean(row.blacklist_reason),
  }));
};

const findFarmerStatusById = async (statusId) => {
  const [rows] = await db.execute(
    `SELECT
      id,
      aadhaar,
      farmer_name,
      mobile_number,
      district,
      mandal,
      village,
      status_color,
      ration_card_number,
      address,
      amount_pending,
      remarks,
      created_by_dealer_id,
      vote_count,
      created_at,
      updated_at
     FROM farmer_statuses
     WHERE id = ?
     LIMIT 1`,
    [statusId],
  );

  return rows[0] || null;
};

const hasDealerVotedForFarmerStatus = async ({ statusId, dealerId }) => {
  const [rows] = await db.execute(
    "SELECT id FROM farmer_status_votes WHERE status_id = ? AND dealer_id = ? LIMIT 1",
    [statusId, dealerId],
  );

  return Boolean(rows[0]);
};

const createFarmerStatus = async ({
  aadhaar,
  farmerName,
  mobileNumber,
  district,
  mandal,
  village,
  statusColor,
  rationCardNumber,
  address,
  amountPending,
  remarks,
  createdByDealerId,
}) => {
  const normalizedAadhaar = normalizeDigits(aadhaar);
  const normalizedMobile = normalizeDigits(mobileNumber);
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.execute(
      `INSERT INTO farmer_statuses
        (aadhaar, farmer_name, mobile_number, district, mandal, village, status_color, ration_card_number, address, amount_pending, remarks, created_by_dealer_id, vote_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        normalizedAadhaar,
        farmerName,
        normalizedMobile || null,
        district,
        mandal,
        village,
        statusColor,
        rationCardNumber || null,
        address || null,
        amountPending ?? null,
        remarks || null,
        createdByDealerId,
      ],
    );

    await connection.execute(
      "INSERT INTO farmer_status_votes (status_id, dealer_id) VALUES (?, ?)",
      [result.insertId, createdByDealerId],
    );

    await connection.commit();

    return {
      id: result.insertId,
      aadhaar: normalizedAadhaar,
      farmerName,
      mobileNumber: normalizedMobile || null,
      district,
      mandal,
      village,
      statusColor,
      rationCardNumber: rationCardNumber || null,
      address: address || null,
      amountPending: amountPending ?? null,
      remarks: remarks || null,
      createdByDealerId,
      voteCount: 1,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const voteFarmerStatus = async ({ statusId, dealerId }) => {
  const [result] = await db.execute(
    "INSERT INTO farmer_status_votes (status_id, dealer_id) VALUES (?, ?)",
    [statusId, dealerId],
  );

  await db.execute(
    "UPDATE farmer_statuses SET vote_count = vote_count + 1 WHERE id = ?",
    [statusId],
  );

  return result.insertId;
};

module.exports = {
  findFarmerStatusByAadhaarOrMobile,
  searchFarmerStatuses,
  findFarmerStatusById,
  hasDealerVotedForFarmerStatus,
  createFarmerStatus,
  voteFarmerStatus,
};
