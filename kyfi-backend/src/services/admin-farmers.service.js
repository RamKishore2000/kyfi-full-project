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
  status: row.status_color,
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

const getAdminFarmers = async () => {
  const [rows] = await db.execute(
    `SELECT
       ranked.id,
       ranked.aadhaar,
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
       ranked.blacklist_reason
     FROM (
       SELECT
         combined.*,
         ROW_NUMBER() OVER (
           PARTITION BY combined.aadhaar
           ORDER BY combined.updated_at DESC, combined.created_at DESC, combined.source_rank DESC
         ) AS rn
       FROM (
         SELECT
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
           0 AS source_rank
         FROM farmer_statuses fs
         LEFT JOIN blacklist_entries b ON b.aadhaar = fs.aadhaar

         UNION ALL

         SELECT
           b.id,
           b.aadhaar,
           b.farmer_name,
           NULL AS mobile_number,
           b.district,
           b.mandal,
           b.village,
           'BLACKLISTED' AS status_color,
           NULL AS ration_card_number,
           b.address,
           NULL AS amount_pending,
           b.reason AS remarks,
           b.created_by_dealer_id,
           0 AS vote_count,
           b.created_at,
           b.updated_at,
           b.reason AS blacklist_reason,
           1 AS source_rank
         FROM blacklist_entries b
         LEFT JOIN farmer_statuses fs ON fs.aadhaar = b.aadhaar
         WHERE fs.id IS NULL
       ) AS combined
     ) AS ranked
     WHERE ranked.rn = 1
     ORDER BY ranked.updated_at DESC`,
  );

  return rows.map(serializeFarmer);
};

module.exports = { getAdminFarmers };
