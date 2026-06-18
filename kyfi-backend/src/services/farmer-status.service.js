const fs = require("fs/promises");
const path = require("path");
const { randomUUID } = require("crypto");
const db = require("../config/db");

const normalizeDigits = (value) => String(value || "").replace(/\D/g, "");
const PROOF_UPLOAD_DIR = path.join(process.cwd(), "uploads", "farmer-proofs");
const MAX_PROOF_IMAGE_BYTES = 5 * 1024 * 1024;
const PROOF_IMAGE_SIZE_MESSAGE = "Please upload an image below 5 MB.";

const saveProofImage = async (dataUrl) => {
  if (!dataUrl) return null;
  const match = String(dataUrl).match(/^data:image\/webp;base64,([a-zA-Z0-9+/=]+)$/);
  if (!match) {
    const error = new Error("Proof image must be a WebP image");
    error.statusCode = 400;
    throw error;
  }

  const buffer = Buffer.from(match[1], "base64");
  if (!buffer.length) {
    const error = new Error("Proof image is invalid");
    error.statusCode = 400;
    throw error;
  }

  if (buffer.length > MAX_PROOF_IMAGE_BYTES) {
    const error = new Error(PROOF_IMAGE_SIZE_MESSAGE);
    error.statusCode = 400;
    throw error;
  }

  await fs.mkdir(PROOF_UPLOAD_DIR, { recursive: true });
  const fileName = `${Date.now()}-${randomUUID()}.webp`;
  await fs.writeFile(path.join(PROOF_UPLOAD_DIR, fileName), buffer);
  return `/uploads/farmer-proofs/${fileName}`;
};

const deleteProofImage = async (proofImagePath) => {
  if (!proofImagePath || typeof proofImagePath !== "string") return;
  if (!proofImagePath.startsWith("/uploads/farmer-proofs/")) return;

  const fileName = path.basename(proofImagePath);
  await fs.unlink(path.join(PROOF_UPLOAD_DIR, fileName)).catch((error) => {
    if (error?.code !== "ENOENT") throw error;
  });
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

let farmerStatusSchemaInitPromise = null;

const ensureFarmerStatusSchemaOnce = async () => {
  if (!farmerStatusSchemaInitPromise) {
    farmerStatusSchemaInitPromise = (async () => {
      await ensureFarmerStatusSchema();
      await ensureFarmerStatusVotesSchema();
      await ensureFarmerStatusCountActionsSchema();
      await ensureAdminFarmerVoteProofsSchema();
    })().catch((error) => {
      farmerStatusSchemaInitPromise = null;
      throw error;
    });
  }

  return farmerStatusSchemaInitPromise;
};

const ensureAdminFarmerVoteProofsSchema = async () => {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS admin_farmer_vote_proofs (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      status_id BIGINT UNSIGNED NOT NULL,
      admin_id INT UNSIGNED NOT NULL,
      proof_image_path VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_admin_vote_proof_status (status_id),
      KEY idx_admin_vote_proof_admin (admin_id),
      CONSTRAINT fk_admin_vote_proof_status FOREIGN KEY (status_id) REFERENCES farmer_statuses(id) ON DELETE CASCADE,
      CONSTRAINT fk_admin_vote_proof_admin FOREIGN KEY (admin_id) REFERENCES dealers(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  );
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

  if (!(await columnIsNullable("farmer_statuses", "status_color"))) {
    await db.execute("ALTER TABLE farmer_statuses MODIFY status_color ENUM('GREEN', 'YELLOW', 'RED') DEFAULT NULL");
  }

  const hasDealerScopedAadhaarIndex = await indexExists("farmer_statuses", "uq_farmer_status_dealer_aadhaar");
  if (!hasDealerScopedAadhaarIndex) {
    const hasLegacyAadhaarIndex = await indexExists("farmer_statuses", "uq_farmer_status_aadhaar");
    if (hasLegacyAadhaarIndex) {
      await db.execute("ALTER TABLE farmer_statuses DROP INDEX uq_farmer_status_aadhaar");
    }

    await db.execute(
      "ALTER TABLE farmer_statuses ADD UNIQUE KEY uq_farmer_status_dealer_aadhaar (created_by_dealer_id, aadhaar)",
    );
  }

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

  const hasProofImagePath = await columnExists("farmer_statuses", "proof_image_path");
  if (!hasProofImagePath) {
    await db.execute("ALTER TABLE farmer_statuses ADD COLUMN proof_image_path VARCHAR(255) DEFAULT NULL AFTER remarks");
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

  const hasProofImagePath = await columnExists("farmer_status_count_actions", "proof_image_path");
  if (!hasProofImagePath) {
    await db.execute(
      "ALTER TABLE farmer_status_count_actions ADD COLUMN proof_image_path VARCHAR(255) DEFAULT NULL AFTER action_type",
    );
  }
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

const findFarmerStatusByAadhaarOrMobileAndDealer = async ({ aadhaar, mobileNumber, dealerId }) => {
  await ensureFarmerStatusSchemaOnce();
  const conditions = [];
  const params = [];
  const dealerIdNumber = Number(dealerId || 0) || 0;

  if (aadhaar) {
    conditions.push("aadhaar = ?");
    params.push(normalizeDigits(aadhaar));
  }

  if (mobileNumber) {
    conditions.push("mobile_number = ?");
    params.push(normalizeDigits(mobileNumber));
  }

  if (!conditions.length || !dealerIdNumber) {
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
      proof_image_path,
      created_by_dealer_id,
      vote_count,
      created_at,
      updated_at
     FROM farmer_statuses
     WHERE created_by_dealer_id = ?
       AND (${conditions.join(" OR ")})
     ORDER BY created_at DESC
     LIMIT 1`,
    [dealerIdNumber, ...params],
  );

  return rows[0] || null;
};

const findOldFarmerStatusByMobile = async ({ mobileNumber }) => {
  await ensureFarmerStatusSchemaOnce();
  const normalizedMobile = normalizeDigits(mobileNumber);

  if (!normalizedMobile) {
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
      proof_image_path,
      created_by_dealer_id,
      vote_count,
      created_at,
      updated_at
     FROM farmer_statuses
     WHERE UPPER(COALESCE(farmer_type, '')) = 'OLD'
       AND (
         mobile_number = ?
         OR REPLACE(REPLACE(REPLACE(REPLACE(mobile_number, ' ', ''), '-', ''), '(', ''), ')', '') = ?
       )
     ORDER BY updated_at DESC, created_at DESC
     LIMIT 1`,
    [normalizedMobile, normalizedMobile],
  );

  return rows[0] || null;
};

const getAadhaarNewFarmerDuplicatePolicy = async ({ aadhaar, dealerId }) => {
  await ensureFarmerStatusSchemaOnce();
  const normalizedAadhaar = normalizeDigits(aadhaar);
  const dealerIdNumber = Number(dealerId || 0) || 0;

  if (!normalizedAadhaar) {
    return {
      totalMatches: 0,
      sameDealerExists: false,
      hasBlockingStatus: false,
      canCreateNewForDealer: true,
    };
  }

  const [rows] = await db.execute(
    `SELECT
       COUNT(*) AS total_matches,
       SUM(CASE WHEN created_by_dealer_id = ? THEN 1 ELSE 0 END) AS same_dealer_matches,
       SUM(CASE WHEN status_color IN ('YELLOW', 'RED') THEN 1 ELSE 0 END) AS blocking_matches
     FROM farmer_statuses
     WHERE aadhaar = ?`,
    [dealerIdNumber, normalizedAadhaar],
  );

  const summary = rows[0] || {};
  const totalMatches = Number(summary.total_matches || 0);
  const sameDealerExists = Number(summary.same_dealer_matches || 0) > 0;
  const hasBlockingStatus = Number(summary.blocking_matches || 0) > 0;

  return {
    totalMatches,
    sameDealerExists,
    hasBlockingStatus,
    canCreateNewForDealer: !sameDealerExists && !hasBlockingStatus,
  };
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
      fs.proof_image_path,
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
      proof_image_path,
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

const getFarmerStatusVoters = async (statusId) => {
  await ensureFarmerStatusSchemaOnce();
  const farmerStatusId = Number(statusId || 0);
  if (!farmerStatusId) {
    return [];
  }

  const [rows] = await db.execute(
    `SELECT
       fsca.status_id,
       fsca.id AS vote_entry_id,
       fsca.dealer_id,
       'DEALER' AS voter_type,
       d.name AS dealer_name,
       d.mobile AS dealer_mobile,
       COALESCE(fsv.vote_color, 'PENDING') AS vote_color,
       1 AS vote_count,
       fsca.proof_image_path,
       fs.district,
       fs.mandal,
       fs.village,
       DATE_FORMAT(DATE_ADD('1970-01-01 00:00:00', INTERVAL (UNIX_TIMESTAMP(fsca.updated_at) + 19800) SECOND), '%Y-%m-%d %H:%i:%s') AS voted_at
     FROM farmer_status_count_actions fsca
     INNER JOIN farmer_statuses fs ON fs.id = fsca.status_id
     INNER JOIN dealers d ON d.id = fsca.dealer_id
     LEFT JOIN farmer_status_votes fsv
       ON fsv.status_id = fsca.status_id
      AND fsv.dealer_id = fsca.dealer_id
     WHERE fsca.status_id = ?
       AND fsca.action_type = 'INCREMENT'
     UNION ALL
     SELECT
       afv.status_id,
       afvp.id AS vote_entry_id,
       afv.admin_id AS dealer_id,
       'SUPER_ADMIN' AS voter_type,
       COALESCE(d.name, 'Super Admin') AS dealer_name,
       COALESCE(d.mobile, '') AS dealer_mobile,
       'PENDING' AS vote_color,
       1 AS vote_count,
       afvp.proof_image_path,
       fs.district,
       fs.mandal,
       fs.village,
       DATE_FORMAT(DATE_ADD('1970-01-01 00:00:00', INTERVAL (UNIX_TIMESTAMP(afvp.created_at) + 19800) SECOND), '%Y-%m-%d %H:%i:%s') AS voted_at
     FROM admin_farmer_votes afv
     INNER JOIN farmer_statuses fs ON fs.id = afv.status_id
     LEFT JOIN dealers d ON d.id = afv.admin_id
     INNER JOIN admin_farmer_vote_proofs afvp
       ON afvp.status_id = afv.status_id
      AND afvp.admin_id = afv.admin_id
     WHERE afv.status_id = ?
       AND afv.vote_count > 0
     ORDER BY voted_at DESC`,
    [farmerStatusId, farmerStatusId],
  );

  return rows.map((row) => ({
    statusId: Number(row.status_id),
    voteEntryId: Number(row.vote_entry_id || 0),
    dealerId: Number(row.dealer_id),
    voterType: row.voter_type || "DEALER",
    dealerName: row.dealer_name,
    dealerMobile: row.dealer_mobile,
    voteColor: row.vote_color || "PENDING",
    voteCount: Number(row.vote_count || 1),
    district: row.district || null,
    mandal: row.mandal || null,
    village: row.village || null,
    proofImageUrl: row.proof_image_path || null,
    votedAt: row.voted_at,
  }));
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
  proofImageDataUrl,
  createdByDealerId,
}) => {
  await ensureFarmerStatusSchemaOnce();
  const normalizedAadhaar = normalizeDigits(aadhaar);
  const normalizedMobile = normalizeDigits(mobileNumber);
  const normalizedFarmerType = String(farmerType || "OLD").trim().toUpperCase() === "NEW" ? "NEW" : "OLD";
  const connection = await db.getConnection();
  let proofImagePath = null;

  try {
    proofImagePath = normalizedFarmerType === "OLD" ? await saveProofImage(proofImageDataUrl) : null;
    await connection.beginTransaction();

    const [result] = await connection.execute(
      `INSERT INTO farmer_statuses
        (aadhaar, farmer_type, farmer_name, mobile_number, district, mandal, village, district_id, mandal_id, village_id, status_color, ration_card_number, address, amount_pending, remarks, proof_image_path, created_by_dealer_id, vote_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
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
        proofImagePath,
        createdByDealerId,
      ],
    );

    await connection.execute(
      "INSERT INTO farmer_status_votes (status_id, dealer_id, vote_color) VALUES (?, ?, ?)",
      [result.insertId, createdByDealerId, statusColor],
    );

    await connection.execute(
      "INSERT INTO farmer_status_count_actions (status_id, dealer_id, action_type, proof_image_path) VALUES (?, ?, 'INCREMENT', ?)",
      [result.insertId, createdByDealerId, proofImagePath],
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
      proofImagePath,
      createdByDealerId,
      voteCount: 1,
    };
  } catch (error) {
    await connection.rollback();
    await deleteProofImage(proofImagePath);
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

const changeFarmerStatusCount = async ({ statusId, dealerId, actionType, proofImageDataUrl }) => {
  await ensureFarmerStatusSchemaOnce();

  const normalizedActionType = String(actionType || "").trim().toUpperCase();
  if (!["INCREMENT", "DECREMENT"].includes(normalizedActionType)) {
    throw new Error("Invalid farmer status action");
  }

  const connection = await db.getConnection();
  let savedProofImagePath = null;
  let proofImagePathToDelete = null;

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

      const isOldFarmer = String(farmerStatus.farmer_type || "").toUpperCase() === "OLD";
      if (isOldFarmer && normalizedActionType === "INCREMENT" && !proofImageDataUrl) {
        const error = new Error("Proof image is required to vote for an old farmer");
        error.statusCode = 400;
        throw error;
      }

      if (isOldFarmer && normalizedActionType === "INCREMENT") {
        savedProofImagePath = await saveProofImage(proofImageDataUrl);
      }

    const [existingRows] = await connection.execute(
      "SELECT id, action_type, proof_image_path FROM farmer_status_count_actions WHERE status_id = ? AND dealer_id = ? LIMIT 1 FOR UPDATE",
      [statusId, dealerId],
    );

    const existingAction = existingRows[0]?.action_type || null;
    const existingProofImagePath = existingRows[0]?.proof_image_path || null;

    if (normalizedActionType === "INCREMENT") {
      if (existingAction === "INCREMENT") {
        await connection.commit();
        await deleteProofImage(savedProofImagePath);
        return { action: "locked" };
      }

      if (existingAction === "DECREMENT") {
        await connection.execute(
          "UPDATE farmer_status_count_actions SET action_type = 'INCREMENT', proof_image_path = ?, updated_at = CURRENT_TIMESTAMP WHERE status_id = ? AND dealer_id = ?",
          [savedProofImagePath, statusId, dealerId],
        );
        proofImagePathToDelete = existingProofImagePath;
      } else {
        await connection.execute(
          "INSERT INTO farmer_status_count_actions (status_id, dealer_id, action_type, proof_image_path) VALUES (?, ?, 'INCREMENT', ?)",
          [statusId, dealerId, savedProofImagePath],
        );
      }

      await connection.execute(
        "UPDATE farmer_statuses SET vote_count = vote_count + 1 WHERE id = ?",
        [statusId],
      );

      await connection.commit();
      await deleteProofImage(proofImagePathToDelete);
      return { action: existingAction === "DECREMENT" ? "restored" : "incremented" };
    }

    if (existingAction !== "INCREMENT") {
      await connection.commit();
      return { action: "locked" };
    }

    await connection.execute(
      "UPDATE farmer_status_count_actions SET action_type = 'DECREMENT', proof_image_path = NULL, updated_at = CURRENT_TIMESTAMP WHERE status_id = ? AND dealer_id = ?",
      [statusId, dealerId],
    );

    await connection.execute(
      "UPDATE farmer_statuses SET vote_count = GREATEST(vote_count - 1, 0) WHERE id = ?",
      [statusId],
    );

    await connection.commit();
    await deleteProofImage(existingProofImagePath);
    return { action: "decremented" };
  } catch (error) {
    await connection.rollback();
    await deleteProofImage(savedProofImagePath);
    throw error;
  } finally {
    connection.release();
  }
};

const moveFarmerStatusToOld = async ({ statusId, dealerId, proofImageDataUrl }) => {
  await ensureFarmerStatusSchemaOnce();

  const connection = await db.getConnection();
  let savedProofImagePath = null;

  try {
    await connection.beginTransaction();

    const [statusRows] = await connection.execute(
      "SELECT id, created_by_dealer_id, farmer_type, mobile_number FROM farmer_statuses WHERE id = ? LIMIT 1 FOR UPDATE",
      [statusId],
    );

    const farmerStatus = statusRows[0];

    if (!farmerStatus) {
      await connection.rollback();
      return { action: "missing" };
    }

    if (String(farmerStatus.farmer_type || "").toUpperCase() !== "NEW") {
      await connection.commit();
      return { action: "locked" };
    }

    if (Number(farmerStatus.created_by_dealer_id) !== Number(dealerId)) {
      await connection.rollback();
      return { action: "forbidden" };
    }

    if (!proofImageDataUrl) {
      const error = new Error("Proof image is required to move this farmer to old");
      error.statusCode = 400;
      throw error;
    }

    const normalizedMobile = normalizeDigits(farmerStatus.mobile_number);
    const [oldRows] = await connection.execute(
      `SELECT id
       FROM farmer_statuses
       WHERE UPPER(COALESCE(farmer_type, '')) = 'OLD'
         AND (
           mobile_number = ?
           OR REPLACE(REPLACE(REPLACE(REPLACE(mobile_number, ' ', ''), '-', ''), '(', ''), ')', '') = ?
         )
       ORDER BY updated_at DESC, created_at DESC
       LIMIT 1
       FOR UPDATE`,
      [normalizedMobile, normalizedMobile],
    );

    const existingOldStatusId = Number(oldRows[0]?.id || 0);

    if (existingOldStatusId) {
      savedProofImagePath = await saveProofImage(proofImageDataUrl);

      const [existingActionRows] = await connection.execute(
        "SELECT id, action_type, proof_image_path FROM farmer_status_count_actions WHERE status_id = ? AND dealer_id = ? LIMIT 1 FOR UPDATE",
        [existingOldStatusId, dealerId],
      );
      const existingAction = existingActionRows[0]?.action_type || null;

      if (existingAction === "INCREMENT") {
        await deleteProofImage(savedProofImagePath);
        savedProofImagePath = null;
      } else if (existingAction === "DECREMENT") {
        await connection.execute(
          "UPDATE farmer_status_count_actions SET action_type = 'INCREMENT', proof_image_path = ?, updated_at = CURRENT_TIMESTAMP WHERE status_id = ? AND dealer_id = ?",
          [savedProofImagePath, existingOldStatusId, dealerId],
        );
        await connection.execute(
          "UPDATE farmer_statuses SET vote_count = vote_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
          [existingOldStatusId],
        );
      } else {
        await connection.execute(
          "INSERT INTO farmer_status_count_actions (status_id, dealer_id, action_type, proof_image_path) VALUES (?, ?, 'INCREMENT', ?)",
          [existingOldStatusId, dealerId, savedProofImagePath],
        );
        await connection.execute(
          "UPDATE farmer_statuses SET vote_count = vote_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
          [existingOldStatusId],
        );
      }

      await connection.execute(
        "DELETE FROM farmer_statuses WHERE id = ? AND created_by_dealer_id = ? AND UPPER(COALESCE(farmer_type, '')) = 'NEW'",
        [statusId, dealerId],
      );

      await connection.commit();
      return { action: "voted_existing_and_removed_new", targetStatusId: existingOldStatusId, removedStatusId: statusId };
    }

    await connection.execute(
      "UPDATE farmer_statuses SET farmer_type = 'OLD', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [statusId],
    );
    await connection.commit();
    return { action: "moved", targetStatusId: statusId };
  } catch (error) {
    await connection.rollback();
    await deleteProofImage(savedProofImagePath);
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  findFarmerStatusByAadhaarOrMobile,
  findFarmerStatusByAadhaarOrMobileAndDealer,
  findOldFarmerStatusByMobile,
  getAadhaarNewFarmerDuplicatePolicy,
  searchFarmerStatuses,
  findFarmerStatusById,
  hasDealerVotedForFarmerStatus,
  getDealerFarmerStatusVoteColor,
  getFarmerStatusVoteBreakdown,
  getFarmerStatusVoters,
  getDealerFarmerStatusCountAction,
  createFarmerStatus,
  voteFarmerStatus,
  changeFarmerStatusCount,
  moveFarmerStatusToOld,
};
