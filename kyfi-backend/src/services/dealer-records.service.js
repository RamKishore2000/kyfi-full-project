const db = require("../config/db");

const normalizeDigits = (value) => String(value || "").replace(/\D/g, "");

const listDealerFarmerRecords = async (dealerId) => {
  const [farmerRows] = await db.execute(
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
     WHERE created_by_dealer_id = ?
     ORDER BY created_at DESC`,
    [dealerId],
  );

  const [blacklistRows] = await db.execute(
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
     WHERE created_by_dealer_id = ?
     ORDER BY created_at DESC`,
    [dealerId],
  );

  const [voteRows] = await db.execute(
    `SELECT
      fsv.id,
      fsv.status_id,
      fsv.dealer_id,
      fsv.created_at AS voted_at,
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
     ORDER BY fsv.created_at DESC`,
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
