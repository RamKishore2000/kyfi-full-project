const db = require("../config/db");

const maskAadhaar = (aadhaar) => {
  const digits = String(aadhaar || "").replace(/\D/g, "");
  return digits.length >= 4 ? `XXXX XXXX ${digits.slice(-4)}` : "XXXX XXXX XXXX";
};

const toDateLabel = (value) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const getAdminBlacklistEntries = async () => {
  const [rows] = await db.execute(
    `SELECT
      b.id,
      b.aadhaar,
      b.farmer_name,
      b.district,
      b.mandal,
      b.village,
      b.reason,
      b.address,
      b.created_at,
      b.updated_at,
      fs.status_color
     FROM blacklist_entries b
     LEFT JOIN farmer_statuses fs ON fs.aadhaar = b.aadhaar
     ORDER BY b.created_at DESC`,
  );

  return rows.map((row) => ({
    recordId: row.id,
    id: `BLK-${String(row.id).padStart(4, "0")}`,
    name: row.farmer_name,
    district: row.district,
    mandal: row.mandal,
    village: row.village,
    crop: "General status",
    phone: "-",
    aadhaarMasked: maskAadhaar(row.aadhaar),
    panMasked: undefined,
    rationCard: undefined,
    address: row.address || `${row.village}, ${row.mandal}`,
    status: row.status_color || "RED",
    blacklisted: true,
    blacklistReason: row.reason,
    remarks: "Blacklist entry review",
    voteCount: 0,
    reports: 1,
    dateAdded: toDateLabel(row.created_at),
    lastVerified: toDateLabel(row.updated_at),
    history: ["Blacklist entry added"],
  }));
};

const deleteBlacklistEntryById = async (entryId) => {
  const [result] = await db.execute("DELETE FROM blacklist_entries WHERE id = ?", [entryId]);
  return result.affectedRows > 0;
};

module.exports = { getAdminBlacklistEntries, deleteBlacklistEntryById };
