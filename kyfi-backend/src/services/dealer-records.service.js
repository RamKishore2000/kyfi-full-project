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

  return {
    farmerStatuses: farmerRows,
    blacklistEntries: blacklistRows,
    counts: {
      farmerStatuses: farmerRows.length,
      blacklistEntries: blacklistRows.length,
    },
  };
};

module.exports = {
  listDealerFarmerRecords,
};