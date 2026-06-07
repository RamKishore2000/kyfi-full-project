const db = require("../config/db");

const maskAadhaar = (aadhaar) => {
  const digits = String(aadhaar || "").replace(/\D/g, "");
  return digits.length >= 4 ? `XXXX-XXXX-${digits.slice(-4)}` : "XXXX-XXXX-XXXX";
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
  reports: row.blacklist_reason ? 1 : 0,
  dateAdded: toDateLabel(row.created_at),
  lastVerified: toDateLabel(row.updated_at),
  history: [
    `Status added as ${row.status_color}`,
    ...(row.blacklist_reason ? ["Blacklist warning attached"] : []),
  ],
});

const getAdminFarmers = async ({ farmerType } = {}) => {
  const normalizedFarmerType =
    String(farmerType || "").trim().toUpperCase() === "NEW" ? "NEW" : "OLD";
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
       ranked.created_by_dealer_id,
       ranked.vote_count,
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
         fs.created_by_dealer_id,
         COALESCE(vote_summary.active_vote_count, 0) AS vote_count,
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

const serializeFarmerVote = (row) => ({
  dealerId: Number(row.dealer_id),
  dealerName: row.dealer_name,
  dealerMobile: row.dealer_mobile,
  voteStatus: row.vote_color || "PENDING",
  votedAt: row.voted_at,
  statusId: Number(row.status_id),
});

const getAdminFarmerVotes = async (statusId) => {
  const farmerStatusId = Number(statusId || 0);
  if (!farmerStatusId) {
    return [];
  }

  const [rows] = await db.execute(
    `SELECT
       fsca.status_id,
       fsca.dealer_id,
       d.name AS dealer_name,
       d.mobile AS dealer_mobile,
       COALESCE(fsv.vote_color, 'PENDING') AS vote_color,
       fsca.created_at AS voted_at
     FROM farmer_status_count_actions fsca
     INNER JOIN dealers d ON d.id = fsca.dealer_id
     LEFT JOIN farmer_status_votes fsv
       ON fsv.status_id = fsca.status_id
      AND fsv.dealer_id = fsca.dealer_id
     WHERE fsca.status_id = ?
       AND fsca.action_type = 'INCREMENT'
     ORDER BY fsca.updated_at DESC, fsca.created_at DESC`,
    [farmerStatusId],
  );

  return rows.map(serializeFarmerVote);
};

module.exports = { getAdminFarmers, getAdminFarmerVotes };
