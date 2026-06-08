const db = require("../config/db");
const fs = require("fs/promises");
const path = require("path");
const { randomUUID } = require("crypto");

const PROOF_UPLOAD_DIR = path.join(process.cwd(), "uploads", "farmer-proofs");

const saveProofImage = async (dataUrl) => {
  if (!dataUrl) return null;
  const match = String(dataUrl).match(
    /^data:image\/webp;base64,([a-zA-Z0-9+/=]+)$/,
  );
  if (!match) {
    const error = new Error("Proof image must be a WebP image");
    error.statusCode = 400;
    throw error;
  }

  const buffer = Buffer.from(match[1], "base64");
  if (!buffer.length || buffer.length > 5 * 1024 * 1024) {
    const error = new Error("Proof image is invalid or too large");
    error.statusCode = 400;
    throw error;
  }

  await fs.mkdir(PROOF_UPLOAD_DIR, { recursive: true });
  const fileName = `${Date.now()}-${randomUUID()}.webp`;
  await fs.writeFile(path.join(PROOF_UPLOAD_DIR, fileName), buffer);
  return `/uploads/farmer-proofs/${fileName}`;
};

const deleteProofImage = async (proofImagePath) => {
  if (!proofImagePath) return;
  const fileName = path.basename(String(proofImagePath));
  if (!fileName || fileName !== String(proofImagePath).split("/").pop()) {
    return;
  }

  try {
    await fs.unlink(path.join(PROOF_UPLOAD_DIR, fileName));
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }
};

async function columnExists(tableName, columnName) {
  const [rows] = await db.execute(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [tableName, columnName],
  );

  return Number(rows[0]?.count || 0) > 0;
}

const maskAadhaar = (aadhaar) => {
  const digits = String(aadhaar || "").replace(/\D/g, "");
  return digits.length >= 4
    ? `XXXX-XXXX-${digits.slice(-4)}`
    : "XXXX-XXXX-XXXX";
};

const toDateLabel = (value) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const serializeFarmer = (row) => ({
  statusId: Number(row.id),
  id: `KYF-${String(row.id).padStart(4, "0")}`,
  name: row.farmer_name,
  district: row.district,
  mandal: row.mandal,
  village: row.village,
  crop: "General status",
  phone: row.mobile_number || "—",
  aadhaarMasked: maskAadhaar(row.aadhaar),
  panMasked: undefined,
  rationCard: row.ration_card_number || undefined,
  address: row.address || undefined,
  status: row.status_color || "GREEN",
  farmerType: String(row.farmer_type || "OLD").toUpperCase(),
  dealerCount: Number(row.dealer_count || 0),
  dealerStatuses: row.dealer_statuses || [],
  blacklisted: Boolean(row.blacklist_reason),
  blacklistReason: row.blacklist_reason || undefined,
  remarks: row.remarks || "",
  voteCount: Number(row.vote_count || 0),
  proofImageUrl: row.proof_image_path || null,
  superAdminVoteCount: Number(row.super_admin_vote_count || 0),
  reports: row.blacklist_reason ? 1 : 0,
  dateAdded: toDateLabel(row.created_at),
  lastVerified: toDateLabel(row.updated_at),
  history: [
    `Status added as ${row.status_color}`,
    ...(row.blacklist_reason ? ["Blacklist warning attached"] : []),
  ],
});

const ensureAdminFarmerVoteSchema = async () => {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS admin_farmer_votes (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      status_id BIGINT UNSIGNED NOT NULL,
      admin_id INT UNSIGNED NOT NULL,
      vote_count TINYINT UNSIGNED NOT NULL DEFAULT 0,
      proof_image_path VARCHAR(255) DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_admin_farmer_vote_once (status_id, admin_id),
      KEY idx_admin_farmer_vote_status (status_id),
      KEY idx_admin_farmer_vote_admin (admin_id),
      CONSTRAINT fk_admin_farmer_vote_status FOREIGN KEY (status_id) REFERENCES farmer_statuses(id) ON DELETE CASCADE,
      CONSTRAINT fk_admin_farmer_vote_admin FOREIGN KEY (admin_id) REFERENCES dealers(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  );

  const hasProofImagePath = await columnExists(
    "admin_farmer_votes",
    "proof_image_path",
  );
  if (!hasProofImagePath) {
    await db.execute(
      "ALTER TABLE admin_farmer_votes ADD COLUMN proof_image_path VARCHAR(255) DEFAULT NULL AFTER vote_count",
    );
  }

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

const getAdminFarmers = async ({ farmerType } = {}) => {
  await ensureAdminFarmerVoteSchema();
  const normalizedFarmerType =
    String(farmerType || "")
      .trim()
      .toUpperCase() === "NEW"
      ? "NEW"
      : "OLD";
  const duplicateColumn =
    normalizedFarmerType === "NEW" ? "fs.aadhaar" : "fs.mobile_number";

  const [rows] = await db.execute(
    `SELECT
       ranked.id,
       ranked.aadhaar,
       ranked.farmer_type,
       ranked.farmer_name,
       ranked.mobile_number,
       ranked.district,
       ranked.mandal,
       ranked.village,
       ranked.status_color,
       ranked.ration_card_number,
       ranked.address,
       ranked.amount_pending,
       ranked.remarks,
       ranked.proof_image_path,
       ranked.created_by_dealer_id,
       ranked.vote_count,
       ranked.super_admin_vote_count,
       ranked.created_at,
       ranked.updated_at,
       NULL AS blacklist_reason
     FROM (
       SELECT
         fs.id,
         fs.aadhaar,
         fs.farmer_type,
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
         COALESCE(fs.proof_image_path, proof_summary.proof_image_path) AS proof_image_path,
         fs.created_by_dealer_id,
         COALESCE(vote_summary.active_vote_count, 0) +
           COALESCE(admin_vote_summary.active_vote_count, 0) AS vote_count,
         COALESCE(admin_vote_summary.active_vote_count, 0) AS super_admin_vote_count,
         fs.created_at,
         fs.updated_at,
         ROW_NUMBER() OVER (
           PARTITION BY ${duplicateColumn}
           ORDER BY fs.updated_at DESC, fs.created_at DESC, fs.id DESC
         ) AS rn
       FROM farmer_statuses fs
       LEFT JOIN (
         SELECT status_id, COUNT(*) AS active_vote_count
         FROM farmer_status_count_actions
         WHERE action_type = 'INCREMENT'
         GROUP BY status_id
       ) AS vote_summary ON vote_summary.status_id = fs.id
       LEFT JOIN (
         SELECT status_id, SUM(vote_count) AS active_vote_count
         FROM admin_farmer_votes
         GROUP BY status_id
       ) AS admin_vote_summary ON admin_vote_summary.status_id = fs.id
       LEFT JOIN (
         SELECT status_id, MAX(proof_image_path) AS proof_image_path
         FROM farmer_status_count_actions
         WHERE action_type = 'INCREMENT'
           AND proof_image_path IS NOT NULL
           AND proof_image_path <> ''
         GROUP BY status_id
       ) AS proof_summary ON proof_summary.status_id = fs.id
       WHERE UPPER(COALESCE(fs.farmer_type, 'OLD')) = ?
         AND ${duplicateColumn} IS NOT NULL
         AND ${duplicateColumn} <> ''
     ) AS ranked
     WHERE ranked.rn = 1
     ORDER BY ranked.updated_at DESC`,
    [normalizedFarmerType],
  );

  const farmers = rows.map(serializeFarmer);

  if (normalizedFarmerType !== "NEW" || !rows.length) {
    return farmers;
  }

  const aadhaars = rows.map((row) => row.aadhaar).filter(Boolean);
  if (!aadhaars.length) {
    return farmers;
  }

  const placeholders = aadhaars.map(() => "?").join(", ");
  const [dealerStatusRows] = await db.execute(
    `SELECT
       fs.aadhaar,
       fs.id AS status_id,
       fs.status_color,
       fs.created_at,
       fs.updated_at,
       d.id AS dealer_id,
       d.name AS dealer_name,
       d.mobile AS dealer_mobile,
       d.shop_name AS dealer_shop_name
     FROM farmer_statuses fs
     LEFT JOIN dealers d ON d.id = fs.created_by_dealer_id
     WHERE UPPER(COALESCE(fs.farmer_type, 'OLD')) = 'NEW'
       AND fs.aadhaar IN (${placeholders})
     ORDER BY fs.updated_at DESC, fs.created_at DESC, fs.id DESC`,
    aadhaars,
  );

  const statusDetailsByAadhaar = dealerStatusRows.reduce((accumulator, row) => {
    const key = row.aadhaar;
    if (!accumulator[key]) {
      accumulator[key] = [];
    }
    accumulator[key].push({
      statusId: Number(row.status_id),
      dealerId: Number(row.dealer_id || 0),
      dealerName: row.dealer_name || "Unknown dealer",
      dealerMobile: row.dealer_mobile || "-",
      dealerShopName: row.dealer_shop_name || "",
      status: row.status_color || "GREEN",
      addedAt: row.created_at,
    });
    return accumulator;
  }, {});

  return farmers.map((farmer, index) => {
    const details = statusDetailsByAadhaar[rows[index].aadhaar] || [];
    return {
      ...farmer,
      dealerCount: details.length,
      dealerStatuses: details,
    };
  });
};

const getOldFarmerStatusForUpdate = async (connection, statusId) => {
  const [rows] = await connection.execute(
    `SELECT id, farmer_type
     FROM farmer_statuses
     WHERE id = ?
     LIMIT 1
     FOR UPDATE`,
    [statusId],
  );

  const farmer = rows[0] || null;
  if (!farmer) {
    const error = new Error("Farmer not found");
    error.statusCode = 404;
    throw error;
  }

  if (String(farmer.farmer_type || "").toUpperCase() !== "OLD") {
    const error = new Error(
      "Super Admin voting is available only for old farmers",
    );
    error.statusCode = 400;
    throw error;
  }

  return farmer;
};

const getAdminFarmerVoteSummary = async (connection, statusId, adminId) => {
  const [adminRows] = await connection.execute(
    `SELECT id, vote_count
     FROM admin_farmer_votes
     WHERE status_id = ? AND admin_id = ?
     LIMIT 1
     FOR UPDATE`,
    [statusId, adminId],
  );

  const [totalRows] = await connection.execute(
    `SELECT
       COALESCE((
         SELECT COUNT(*)
         FROM farmer_status_count_actions
         WHERE status_id = ? AND action_type = 'INCREMENT'
       ), 0) +
       COALESCE((
         SELECT SUM(vote_count)
         FROM admin_farmer_votes
         WHERE status_id = ?
       ), 0) AS total_vote_count`,
    [statusId, statusId],
  );

  return {
    row: adminRows[0] || null,
    totalVoteCount: Number(totalRows[0]?.total_vote_count || 0),
  };
};

const incrementOldFarmerSuperAdminVote = async ({
  statusId,
  adminId,
  proofImageDataUrl,
}) => {
  await ensureAdminFarmerVoteSchema();
  const farmerStatusId = Number(statusId || 0);
  const superAdminId = Number(adminId || 0);

  if (!farmerStatusId || !superAdminId) {
    const error = new Error("Valid farmer and admin ids are required");
    error.statusCode = 400;
    throw error;
  }

  const connection = await db.getConnection();
  let proofImagePath = null;

  try {
    if (!proofImageDataUrl) {
      const error = new Error(
        "Proof image is required to add Super Admin vote",
      );
      error.statusCode = 400;
      throw error;
    }

    proofImagePath = await saveProofImage(proofImageDataUrl);
    await connection.beginTransaction();
    await getOldFarmerStatusForUpdate(connection, farmerStatusId);

    const summary = await getAdminFarmerVoteSummary(
      connection,
      farmerStatusId,
      superAdminId,
    );
    const currentAdminVotes = Number(summary.row?.vote_count || 0);

    if (currentAdminVotes >= 3) {
      const error = new Error(
        "Super Admin can add maximum 3 votes for this farmer",
      );
      error.statusCode = 400;
      throw error;
    }

    if (summary.row) {
      await connection.execute(
        "UPDATE admin_farmer_votes SET vote_count = vote_count + 1, proof_image_path = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [proofImagePath, summary.row.id],
      );
    } else {
      await connection.execute(
        "INSERT INTO admin_farmer_votes (status_id, admin_id, vote_count, proof_image_path) VALUES (?, ?, 1, ?)",
        [farmerStatusId, superAdminId, proofImagePath],
      );
    }

    await connection.execute(
      "INSERT INTO admin_farmer_vote_proofs (status_id, admin_id, proof_image_path) VALUES (?, ?, ?)",
      [farmerStatusId, superAdminId, proofImagePath],
    );

    await connection.execute(
      "UPDATE farmer_statuses SET vote_count = vote_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [farmerStatusId],
    );

    await connection.commit();

    return {
      voteCount: summary.totalVoteCount + 1,
      superAdminVoteCount: currentAdminVotes + 1,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const decrementOldFarmerSuperAdminVote = async ({ statusId, adminId }) => {
  await ensureAdminFarmerVoteSchema();
  const farmerStatusId = Number(statusId || 0);
  const superAdminId = Number(adminId || 0);

  if (!farmerStatusId || !superAdminId) {
    const error = new Error("Valid farmer and admin ids are required");
    error.statusCode = 400;
    throw error;
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    await getOldFarmerStatusForUpdate(connection, farmerStatusId);

    const summary = await getAdminFarmerVoteSummary(
      connection,
      farmerStatusId,
      superAdminId,
    );
    const currentAdminVotes = Number(summary.row?.vote_count || 0);

    if (currentAdminVotes <= 0) {
      await connection.commit();
      return {
        voteCount: summary.totalVoteCount,
        superAdminVoteCount: 0,
      };
    }

    const [proofRows] = await connection.execute(
      `SELECT id, proof_image_path
       FROM admin_farmer_vote_proofs
       WHERE status_id = ? AND admin_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT 1
       FOR UPDATE`,
      [farmerStatusId, superAdminId],
    );
    const proofImagePathToDelete = proofRows[0]?.proof_image_path || null;

    await connection.execute(
      "UPDATE admin_farmer_votes SET vote_count = GREATEST(vote_count - 1, 0), updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [summary.row.id],
    );

    if (proofRows[0]?.id) {
      await connection.execute(
        "DELETE FROM admin_farmer_vote_proofs WHERE id = ?",
        [proofRows[0].id],
      );
    }

    await connection.execute(
      "UPDATE farmer_statuses SET vote_count = GREATEST(vote_count - 1, 0), updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [farmerStatusId],
    );

    await connection.commit();
    await deleteProofImage(proofImagePathToDelete);

    return {
      voteCount: Math.max(summary.totalVoteCount - 1, 0),
      superAdminVoteCount: currentAdminVotes - 1,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const serializeFarmerVote = (row) => ({
  voteEntryId: Number(row.vote_entry_id || 0),
  dealerId: Number(row.dealer_id),
  dealerName: row.dealer_name,
  dealerMobile: row.dealer_mobile,
  voteStatus: row.vote_color || "PENDING",
  votedAt: row.voted_at,
  statusId: Number(row.status_id),
  voterType: row.voter_type || "DEALER",
  voteCount: Number(row.vote_count || 1),
  proofImageUrl: row.proof_image_path || null,
});

const getAdminFarmerVotes = async (statusId) => {
  const farmerStatusId = Number(statusId || 0);
  if (!farmerStatusId) {
    return [];
  }

  await ensureAdminFarmerVoteSchema();

  const [rows] = await db.execute(
    `SELECT *
     FROM (
      SELECT
        fsca.status_id,
        fsca.id AS vote_entry_id,
        fsca.dealer_id,
         d.name AS dealer_name,
         d.mobile AS dealer_mobile,
         COALESCE(fsv.vote_color, 'PENDING') AS vote_color,
         fsca.proof_image_path,
         fsca.created_at AS voted_at,
         'DEALER' AS voter_type,
         1 AS vote_count,
         fsca.updated_at AS sort_at
       FROM farmer_status_count_actions fsca
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
        d.name AS dealer_name,
        d.mobile AS dealer_mobile,
        'SUPER_ADMIN' AS vote_color,
        afvp.proof_image_path,
        afvp.created_at AS voted_at,
        'SUPER_ADMIN' AS voter_type,
        1 AS vote_count,
        afvp.created_at AS sort_at
      FROM admin_farmer_votes afv
      INNER JOIN dealers d ON d.id = afv.admin_id
      INNER JOIN admin_farmer_vote_proofs afvp
        ON afvp.status_id = afv.status_id
       AND afvp.admin_id = afv.admin_id
      WHERE afv.status_id = ?
        AND afv.vote_count > 0
     ) AS combined_votes
     ORDER BY sort_at DESC, voted_at DESC`,
    [farmerStatusId, farmerStatusId],
  );

  return rows.map(serializeFarmerVote);
};

module.exports = {
  getAdminFarmers,
  getAdminFarmerVotes,
  incrementOldFarmerSuperAdminVote,
  decrementOldFarmerSuperAdminVote,
};
