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
      b.reason AS blacklist_reason
     FROM farmer_statuses fs
     LEFT JOIN blacklist_entries b ON b.aadhaar = fs.aadhaar
     ORDER BY fs.created_at DESC`,
  );

  return rows.map(serializeFarmer);
};

module.exports = { getAdminFarmers };
