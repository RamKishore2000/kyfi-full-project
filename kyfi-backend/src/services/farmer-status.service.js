const db = require("../config/db");

const normalizeDigits = (value) => String(value || "").replace(/\D/g, "");

const columnIsNullable = async (tableName, columnName) => {
  const [rows] = await db.execute(
    `SELECT IS_NULLABLE
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?
     LIMIT 1`,
    [tableName, columnName],
  );

  return String(rows[0]?.IS_NULLABLE || "").toUpperCase() === "YES";
};

const ensureFarmerStatusSchema = async () => {
  const hasNullableAadhaar = await columnIsNullable("farmer_statuses", "aadhaar");

  if (!hasNullableAadhaar) {
    await db.execute("ALTER TABLE farmer_statuses MODIFY aadhaar VARCHAR(16) DEFAULT NULL");
  }

  await db.execute("UPDATE farmer_statuses SET aadhaar = NULL WHERE aadhaar = ''");
};

const ensureFarmerStatusVotesSchema = async () => {
  const [rows] = await db.execute(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'farmer_status_votes'
       AND COLUMN_NAME = 'updated_at'`,
  );

  if (Number(rows[0]?.count || 0) === 0) {
    await db.execute(
      `ALTER TABLE farmer_status_votes
       ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
       AFTER created_at`,
    );
  }
};

const buildEmptyVoteBreakdown = () => ({
  GREEN: 0,
  YELLOW: 0,
  RED: 0,
});

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

const searchFarmerStatuses = async ({ term, mandal, village, farmerName }) => {
  const normalizedTerm = String(term || "").trim();
  const normalizedMandal = String(mandal || "").trim();
  const normalizedVillage = String(village || "").trim();
  const normalizedFarmerName = String(farmerName || "").trim();

  if (!normalizedTerm && !normalizedMandal && !normalizedVillage && !normalizedFarmerName) {
    return [];
  }

  const conditions = [];
  const params = [];

  const addLikeCondition = (column, value) => {
    const normalized = String(value || "").trim();
    if (!normalized) return;
    conditions.push(`LOWER(fs.${column}) LIKE LOWER(?)`);
    params.push(`%${normalized}%`);
  };

  if (normalizedTerm) {
    const digitsOnly = normalizedTerm.replace(/\D/g, "");
    const searchTerm = `%${normalizedTerm}%`;
    conditions.push(
      "(LOWER(fs.farmer_name) LIKE LOWER(?) OR LOWER(fs.district) LIKE LOWER(?) OR LOWER(fs.mandal) LIKE LOWER(?) OR LOWER(fs.village) LIKE LOWER(?))",
    );
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);

    if (digitsOnly) {
      conditions.push("(fs.aadhaar LIKE ? OR fs.mobile_number LIKE ?)");
      params.push(`%${digitsOnly}%`, `%${digitsOnly}%`);
    }
  }

  addLikeCondition("mandal", normalizedMandal);
  addLikeCondition("village", normalizedVillage);
  addLikeCondition("farmer_name", normalizedFarmerName);

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
      LEFT JOIN blacklist_entries b
        ON (b.aadhaar IS NOT NULL AND b.aadhaar <> '' AND b.aadhaar = fs.aadhaar)
        OR (b.mobile_number IS NOT NULL AND b.mobile_number <> '' AND b.mobile_number = fs.mobile_number)
      WHERE ${conditions.join(" AND ")}
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

const getDealerFarmerStatusVoteColor = async ({ statusId, dealerId }) => {
  const [rows] = await db.execute(
    `SELECT COALESCE(fsv.vote_color, fs.status_color) AS vote_color
     FROM farmer_status_votes fsv
     INNER JOIN farmer_statuses fs ON fs.id = fsv.status_id
     WHERE fsv.status_id = ? AND fsv.dealer_id = ?
     LIMIT 1`,
    [statusId, dealerId],
  );

  return rows[0]?.vote_color || null;
};

const getFarmerStatusVoteBreakdown = async (statusId) => {
  const [rows] = await db.execute(
    `SELECT
       SUM(CASE WHEN COALESCE(fsv.vote_color, fs.status_color) = 'GREEN' THEN 1 ELSE 0 END) AS green_vote_count,
       SUM(CASE WHEN COALESCE(fsv.vote_color, fs.status_color) = 'YELLOW' THEN 1 ELSE 0 END) AS yellow_vote_count,
       SUM(CASE WHEN COALESCE(fsv.vote_color, fs.status_color) = 'RED' THEN 1 ELSE 0 END) AS red_vote_count
     FROM farmer_status_votes fsv
     INNER JOIN farmer_statuses fs ON fs.id = fsv.status_id
     WHERE fsv.status_id = ?`,
    [statusId],
  );

  return {
    GREEN: Number(rows[0]?.green_vote_count || 0),
    YELLOW: Number(rows[0]?.yellow_vote_count || 0),
    RED: Number(rows[0]?.red_vote_count || 0),
  };
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
  await ensureFarmerStatusSchema();
  await ensureFarmerStatusVotesSchema();
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
        normalizedAadhaar || null,
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
      "INSERT INTO farmer_status_votes (status_id, dealer_id, vote_color) VALUES (?, ?, ?)",
      [result.insertId, createdByDealerId, statusColor],
    );

    await connection.commit();

    return {
      id: result.insertId,
      aadhaar: normalizedAadhaar || null,
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

const voteFarmerStatus = async ({ statusId, dealerId, voteColor, createdByDealerId }) => {
  await ensureFarmerStatusVotesSchema();
  const normalizedVoteColor = String(voteColor || "").trim().toUpperCase();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [existingRows] = await connection.execute(
      "SELECT id, vote_color FROM farmer_status_votes WHERE status_id = ? AND dealer_id = ? LIMIT 1 FOR UPDATE",
      [statusId, dealerId],
    );

    const existingVote = existingRows[0];

    if (existingVote) {
      if (existingVote.vote_color === normalizedVoteColor) {
        if (createdByDealerId && Number(createdByDealerId) === Number(dealerId)) {
          await connection.commit();
          return { action: "locked" };
        }

        await connection.execute(
          "DELETE FROM farmer_status_votes WHERE status_id = ? AND dealer_id = ?",
          [statusId, dealerId],
        );

        await connection.execute(
          "UPDATE farmer_statuses SET vote_count = GREATEST(vote_count - 1, 0) WHERE id = ?",
          [statusId],
        );

        await connection.commit();
        return { action: "removed" };
      } else {
        await connection.execute(
          "UPDATE farmer_status_votes SET vote_color = ?, updated_at = CURRENT_TIMESTAMP WHERE status_id = ? AND dealer_id = ?",
          [normalizedVoteColor, statusId, dealerId],
        );

        await connection.commit();
        return { action: "updated" };
      }
    } else {
      await connection.execute(
        "INSERT INTO farmer_status_votes (status_id, dealer_id, vote_color) VALUES (?, ?, ?)",
        [statusId, dealerId, normalizedVoteColor],
      );

      await connection.execute(
        "UPDATE farmer_statuses SET vote_count = vote_count + 1 WHERE id = ?",
        [statusId],
      );

      await connection.commit();
      return { action: "added" };
    }
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  findFarmerStatusByAadhaarOrMobile,
  searchFarmerStatuses,
  findFarmerStatusById,
  hasDealerVotedForFarmerStatus,
  getDealerFarmerStatusVoteColor,
  getFarmerStatusVoteBreakdown,
  createFarmerStatus,
  voteFarmerStatus,
};
