const db = require("../config/db");

const normalizeDigits = (value) => String(value || "").replace(/\D/g, "");

const ensureDealerVoteSchema = async () => {
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

const listDealerFarmerRecords = async (dealerId) => {
  await ensureDealerVoteSchema();
  const [farmerRows] = await db.execute(
    `SELECT
      fs.id,
      fs.aadhaar,
      fs.farmer_name,
      fs.mobile_number,
      fs.district,
      fs.mandal,
      fs.village,
      fs.status_color,
      fsv.vote_color AS current_dealer_vote_color,
      fs.ration_card_number,
      fs.address,
      fs.amount_pending,
      fs.remarks,
      fs.created_by_dealer_id,
      fs.vote_count,
      fs.created_at,
      fs.updated_at
     FROM farmer_statuses fs
     LEFT JOIN farmer_status_votes fsv
       ON fsv.status_id = fs.id
      AND fsv.dealer_id = ?
     WHERE fs.created_by_dealer_id = ?
     ORDER BY fs.created_at DESC`,
    [dealerId, dealerId],
  );

  const [blacklistRows] = await db.execute(
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
     WHERE created_by_dealer_id = ?
     ORDER BY created_at DESC`,
    [dealerId],
  );

  const [voteRows] = await db.execute(
    `SELECT
      fsv.id,
      fsv.status_id,
      fsv.dealer_id,
      fsv.vote_color,
      fsv.updated_at AS voted_at,
      fs.aadhaar,
      fs.farmer_name,
      fs.mobile_number,
      fs.district,
      fs.mandal,
      fs.village,
      fs.status_color,
      fs.created_at AS farmer_created_at,
      fs.updated_at AS farmer_updated_at
     FROM farmer_status_votes fsv
     INNER JOIN farmer_statuses fs ON fs.id = fsv.status_id
     WHERE fsv.dealer_id = ?
     ORDER BY fsv.updated_at DESC, fsv.created_at DESC`,
    [dealerId],
  );

  return {
    farmerStatuses: farmerRows,
    blacklistEntries: blacklistRows,
    votes: voteRows,
    counts: {
      farmerStatuses: farmerRows.length,
      blacklistEntries: blacklistRows.length,
      votes: voteRows.length,
    },
  };
};

module.exports = {
  listDealerFarmerRecords,
};
