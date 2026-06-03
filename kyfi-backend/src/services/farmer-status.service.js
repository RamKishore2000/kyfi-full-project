const db = require("../config/db");

const normalizeDigits = (value) => String(value || "").replace(/\D/g, "");

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

let farmerStatusSchemaInitPromise = null;

const ensureFarmerStatusSchemaOnce = async () => {
  if (!farmerStatusSchemaInitPromise) {
    farmerStatusSchemaInitPromise = (async () => {
      await ensureFarmerStatusSchema();
      await ensureFarmerStatusVotesSchema();
      await ensureFarmerStatusCountActionsSchema();
    })().catch((error) => {
      farmerStatusSchemaInitPromise = null;
      throw error;
    });
  }

  return farmerStatusSchemaInitPromise;
};

const ensureFarmerStatusSchema = async () => {
  const hasFarmerType = await columnExists("farmer_statuses", "farmer_type");
  if (!hasFarmerType) {
    await db.execute(
      "ALTER TABLE farmer_statuses ADD COLUMN farmer_type ENUM('OLD', 'NEW') NOT NULL DEFAULT 'OLD' AFTER mobile_number",
    );
  }

  const hasNullableAadhaar = await db.execute(
    `SELECT IS_NULLABLE
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'farmer_statuses'
       AND COLUMN_NAME = 'aadhaar'
     LIMIT 1`,
  );
  if (String(hasNullableAadhaar[0]?.[0]?.IS_NULLABLE || "").toUpperCase() === "NO") {
    await db.execute("ALTER TABLE farmer_statuses MODIFY aadhaar VARCHAR(16) DEFAULT NULL");
  }

  await db.execute("UPDATE farmer_statuses SET aadhaar = NULL WHERE aadhaar = ''");
  await db.execute("UPDATE farmer_statuses SET farmer_type = 'OLD' WHERE farmer_type IS NULL OR farmer_type = ''");

  const hasDistrictId = await columnExists("farmer_statuses", "district_id");
  if (!hasDistrictId) {
    await db.execute("ALTER TABLE farmer_statuses ADD COLUMN district_id BIGINT UNSIGNED DEFAULT NULL AFTER village");
  }

  const hasMandalId = await columnExists("farmer_statuses", "mandal_id");
  if (!hasMandalId) {
    await db.execute("ALTER TABLE farmer_statuses ADD COLUMN mandal_id BIGINT UNSIGNED DEFAULT NULL AFTER district_id");
  }

  const hasVillageId = await columnExists("farmer_statuses", "village_id");
  if (!hasVillageId) {
    await db.execute("ALTER TABLE farmer_statuses ADD COLUMN village_id BIGINT UNSIGNED DEFAULT NULL AFTER mandal_id");
  }
};

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

const ensureFarmerStatusCountActionsSchema = async () => {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS farmer_status_count_actions (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      status_id BIGINT UNSIGNED NOT NULL,
      dealer_id INT UNSIGNED NOT NULL,
      action_type ENUM('INCREMENT', 'DECREMENT') NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_farmer_status_count_action_once (status_id, dealer_id),
      KEY idx_farmer_status_count_action_status (status_id),
      KEY idx_farmer_status_count_action_dealer (dealer_id),
      CONSTRAINT fk_farmer_status_count_action_status FOREIGN KEY (status_id) REFERENCES farmer_statuses(id) ON DELETE CASCADE,
      CONSTRAINT fk_farmer_status_count_action_dealer FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE CASCADE
    )`,
  );

  await db.execute(
    `INSERT IGNORE INTO farmer_status_count_actions (status_id, dealer_id, action_type)
     SELECT fsv.status_id, fsv.dealer_id, 'INCREMENT'
     FROM farmer_status_votes fsv`,
  );
};

const buildEmptyVoteBreakdown = () => ({
  GREEN: 0,
  YELLOW: 0,
  RED: 0,
});

const findFarmerStatusByAadhaarOrMobile = async ({ aadhaar, mobileNumber }) => {
  await ensureFarmerStatusSchemaOnce();
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
      farmer_type,
      district,
      mandal,
      village,
      district_id,
      mandal_id,
      village_id,
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

const searchFarmerStatuses = async ({ dealerId, term, mandal, village, farmerName }) => {
  await ensureFarmerStatusSchemaOnce();
  const normalizedTerm = String(term || "").trim();
  const normalizedMandal = String(mandal || "").trim();
  const normalizedVillage = String(village || "").trim();
  const normalizedFarmerName = String(farmerName || "").trim();
  const viewerDealerId = Number(dealerId || 0) || 0;

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
      fs.farmer_type,
      fs.district,
      fs.mandal,
      fs.village,
      fs.district_id,
      fs.mandal_id,
      fs.village_id,
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
      WHERE (fs.farmer_type = 'OLD' OR fs.created_by_dealer_id = ?)
      ${conditions.length ? `AND ${conditions.join(" AND ")}` : ""}
     ORDER BY fs.created_at DESC
     LIMIT 25`,
    [viewerDealerId, ...params],
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
      farmer_type,
      district,
      mandal,
      village,
      district_id,
      mandal_id,
      village_id,
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

const getDealerFarmerStatusCountAction = async ({ statusId, dealerId }) => {
  await ensureFarmerStatusSchemaOnce();
  const [rows] = await db.execute(
    `SELECT action_type
     FROM farmer_status_count_actions
     WHERE status_id = ? AND dealer_id = ?
     LIMIT 1`,
    [statusId, dealerId],
  );

  return rows[0]?.action_type || null;
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
  farmerType,
  farmerName,
  mobileNumber,
  district,
  mandal,
  village,
  districtId,
  mandalId,
  villageId,
  statusColor,
  rationCardNumber,
  address,
  amountPending,
  remarks,
  createdByDealerId,
}) => {
  await ensureFarmerStatusSchemaOnce();
  const normalizedAadhaar = normalizeDigits(aadhaar);
  const normalizedMobile = normalizeDigits(mobileNumber);
  const normalizedFarmerType = String(farmerType || "OLD").trim().toUpperCase() === "NEW" ? "NEW" : "OLD";
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.execute(
      `INSERT INTO farmer_statuses
        (aadhaar, farmer_type, farmer_name, mobile_number, district, mandal, village, district_id, mandal_id, village_id, status_color, ration_card_number, address, amount_pending, remarks, created_by_dealer_id, vote_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        normalizedAadhaar || null,
        normalizedFarmerType,
        farmerName,
        normalizedMobile || null,
        district,
        mandal,
        village,
        districtId ?? null,
        mandalId ?? null,
        villageId ?? null,
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

    await connection.execute(
      "INSERT INTO farmer_status_count_actions (status_id, dealer_id, action_type) VALUES (?, ?, 'INCREMENT')",
      [result.insertId, createdByDealerId],
    );

    await connection.commit();

    return {
      id: result.insertId,
      aadhaar: normalizedAadhaar || null,
      farmerType: normalizedFarmerType,
      farmerName,
      mobileNumber: normalizedMobile || null,
      district,
      mandal,
      village,
      districtId: districtId ?? null,
      mandalId: mandalId ?? null,
      villageId: villageId ?? null,
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
  await ensureFarmerStatusSchemaOnce();
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

        await connection.execute(
          "UPDATE farmer_statuses SET status_color = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
          [normalizedVoteColor, statusId],
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

      await connection.execute(
        "UPDATE farmer_statuses SET status_color = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [normalizedVoteColor, statusId],
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

const changeFarmerStatusCount = async ({ statusId, dealerId, actionType }) => {
  await ensureFarmerStatusSchemaOnce();

  const normalizedActionType = String(actionType || "").trim().toUpperCase();
  if (!["INCREMENT", "DECREMENT"].includes(normalizedActionType)) {
    throw new Error("Invalid farmer status action");
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

      const [statusRows] = await connection.execute(
        "SELECT id, created_by_dealer_id, farmer_type FROM farmer_statuses WHERE id = ? LIMIT 1 FOR UPDATE",
        [statusId],
      );

      const farmerStatus = statusRows[0];

      if (!farmerStatus) {
        await connection.rollback();
        return { action: "missing" };
      }

      if (
        String(farmerStatus.farmer_type || "").toUpperCase() === "NEW" &&
        Number(farmerStatus.created_by_dealer_id) !== Number(dealerId)
      ) {
        await connection.rollback();
        return { action: "forbidden" };
      }

    const [existingRows] = await connection.execute(
      "SELECT id, action_type FROM farmer_status_count_actions WHERE status_id = ? AND dealer_id = ? LIMIT 1 FOR UPDATE",
      [statusId, dealerId],
    );

    const existingAction = existingRows[0]?.action_type || null;

    if (normalizedActionType === "INCREMENT") {
      if (existingAction === "INCREMENT") {
        await connection.commit();
        return { action: "locked" };
      }

      if (existingAction === "DECREMENT") {
        await connection.execute(
          "UPDATE farmer_status_count_actions SET action_type = 'INCREMENT', updated_at = CURRENT_TIMESTAMP WHERE status_id = ? AND dealer_id = ?",
          [statusId, dealerId],
        );
      } else {
        await connection.execute(
          "INSERT INTO farmer_status_count_actions (status_id, dealer_id, action_type) VALUES (?, ?, 'INCREMENT')",
          [statusId, dealerId],
        );
      }

      await connection.execute(
        "UPDATE farmer_statuses SET vote_count = vote_count + 1 WHERE id = ?",
        [statusId],
      );

      await connection.commit();
      return { action: existingAction === "DECREMENT" ? "restored" : "incremented" };
    }

    if (existingAction !== "INCREMENT") {
      await connection.commit();
      return { action: "locked" };
    }

    await connection.execute(
      "UPDATE farmer_status_count_actions SET action_type = 'DECREMENT', updated_at = CURRENT_TIMESTAMP WHERE status_id = ? AND dealer_id = ?",
      [statusId, dealerId],
    );

    await connection.execute(
      "UPDATE farmer_statuses SET vote_count = GREATEST(vote_count - 1, 0) WHERE id = ?",
      [statusId],
    );

    await connection.commit();
    return { action: "decremented" };
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
  getDealerFarmerStatusCountAction,
  createFarmerStatus,
  voteFarmerStatus,
  changeFarmerStatusCount,
};
