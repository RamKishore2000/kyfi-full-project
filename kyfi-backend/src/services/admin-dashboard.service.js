const db = require("../config/db");

const maskAadhaar = (aadhaar) => {
  const digits = String(aadhaar || "").replace(/\D/g, "");
  return digits.length >= 4 ? `XXXX XXXX ${digits.slice(-4)}` : "XXXX XXXX XXXX";
};

const formatMonthLabel = (dateLike) =>
  new Intl.DateTimeFormat("en-US", { month: "short" }).format(dateLike);

const getRecentMonths = (count = 7) => {
  const months = [];
  const now = new Date();

  for (let index = count - 1; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    months.push({
      key,
      month: formatMonthLabel(date),
      date,
    });
  }

  return months;
};

const toMonthMap = (rows, valueKey) =>
  rows.reduce((accumulator, row) => {
    accumulator[row.ym] = Number(row[valueKey] || 0);
    return accumulator;
  }, {});

const getDashboardSummary = async () => {
  const [
    totalFarmersRows,
    dealerRows,
    votesRows,
    blacklistRows,
    statusRows,
    pendingDealerRows,
    currentMonthVoteRows,
    monthlyFarmerRows,
    monthlyBlacklistRows,
    recentFarmerRows,
    greenBlacklistedRows,
  ] = await Promise.all([
    db.execute(
      `SELECT COUNT(*) AS total
       FROM (
         SELECT aadhaar FROM farmer_statuses
         UNION
         SELECT aadhaar FROM blacklist_entries
       ) AS unique_aadhaars
       WHERE aadhaar IS NOT NULL AND aadhaar <> ''`,
    ),
    db.execute("SELECT COUNT(*) AS total FROM dealers WHERE role = 'dealer'"),
    db.execute("SELECT COUNT(*) AS total FROM farmer_status_votes"),
    db.execute("SELECT COUNT(*) AS total FROM blacklist_entries"),
    db.execute("SELECT status_color AS status, COUNT(*) AS total FROM farmer_statuses GROUP BY status_color"),
    db.execute("SELECT COUNT(*) AS total FROM dealers WHERE role = 'dealer' AND status = 'pending'"),
    db.execute(
      `SELECT COUNT(*) AS total
       FROM farmer_status_votes
       WHERE created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`,
    ),
    db.execute(
      `SELECT ym, COUNT(*) AS total
       FROM (
         SELECT DATE_FORMAT(created_at, '%Y-%m') AS ym, aadhaar
         FROM farmer_statuses
         WHERE created_at >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 6 MONTH), '%Y-%m-01')
           AND aadhaar IS NOT NULL
           AND aadhaar <> ''
         UNION
         SELECT DATE_FORMAT(created_at, '%Y-%m') AS ym, aadhaar
         FROM blacklist_entries
         WHERE created_at >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 6 MONTH), '%Y-%m-01')
           AND aadhaar IS NOT NULL
           AND aadhaar <> ''
       ) AS unique_monthly_farmers
       GROUP BY ym`,
    ),
    db.execute(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') AS ym, COUNT(*) AS total
       FROM blacklist_entries
       WHERE created_at >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 6 MONTH), '%Y-%m-01')
       GROUP BY ym`,
    ),
    db.execute(
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
       ORDER BY ranked.updated_at DESC
       LIMIT 10`,
    ),
    db.execute(
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
       INNER JOIN blacklist_entries b ON b.aadhaar = fs.aadhaar
       WHERE fs.status_color = 'GREEN'
       ORDER BY fs.created_at DESC
       LIMIT 1`,
    ),
  ]);

  const totalFarmers = Number(totalFarmersRows[0][0]?.total || 0);
  const registeredDealers = Number(dealerRows[0][0]?.total || 0);
  const statusVotes = Number(votesRows[0][0]?.total || 0);
  const blacklistEntries = Number(blacklistRows[0][0]?.total || 0);
  const pendingDealers = Number(pendingDealerRows[0][0]?.total || 0);
  const currentMonthVotes = Number(currentMonthVoteRows[0][0]?.total || 0);

  const statusByKey = statusRows[0].reduce(
    (accumulator, row) => {
      accumulator[String(row.status || "").toUpperCase()] = Number(row.total || 0);
      return accumulator;
    },
    { GREEN: 0, YELLOW: 0, RED: 0 },
  );

  const months = getRecentMonths(7);
  const farmersMonthMap = toMonthMap(monthlyFarmerRows[0], "total");
  const blacklistMonthMap = toMonthMap(monthlyBlacklistRows[0], "total");

  const monthlyActivity = months.map((month) => ({
    month: month.month,
    farmers: farmersMonthMap[month.key] || 0,
    reports: blacklistMonthMap[month.key] || 0,
    approvals: month.key === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`
      ? registeredDealers - pendingDealers
      : 0,
  }));

  const farmerRows = recentFarmerRows[0].map((row) => ({
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
    dateAdded: new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(row.created_at)),
    lastVerified: new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(row.updated_at)),
    history: [
      `Status added as ${row.status_color}`,
      ...(row.blacklist_reason ? ["Blacklist warning attached"] : []),
    ],
  }));

  const greenBlacklistedRow = greenBlacklistedRows[0][0]
    ? {
        id: `KYF-${String(greenBlacklistedRows[0][0].id).padStart(4, "0")}`,
        name: greenBlacklistedRows[0][0].farmer_name,
        district: greenBlacklistedRows[0][0].district,
        mandal: greenBlacklistedRows[0][0].mandal,
        village: greenBlacklistedRows[0][0].village,
        crop: "General status",
        phone: greenBlacklistedRows[0][0].mobile_number || "—",
        aadhaarMasked: maskAadhaar(greenBlacklistedRows[0][0].aadhaar),
        panMasked: undefined,
        rationCard: greenBlacklistedRows[0][0].ration_card_number || undefined,
        address: greenBlacklistedRows[0][0].address || undefined,
        status: greenBlacklistedRows[0][0].status_color,
        blacklisted: true,
        blacklistReason: greenBlacklistedRows[0][0].blacklist_reason || undefined,
        remarks: greenBlacklistedRows[0][0].remarks || "",
        voteCount: Number(greenBlacklistedRows[0][0].vote_count || 0),
        reports: 1,
        dateAdded: new Intl.DateTimeFormat("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(new Date(greenBlacklistedRows[0][0].created_at)),
        lastVerified: new Intl.DateTimeFormat("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(new Date(greenBlacklistedRows[0][0].updated_at)),
        history: [
          `Status added as ${greenBlacklistedRows[0][0].status_color}`,
          "Blacklist warning attached",
        ],
      }
    : null;

  const analytics = [
    {
      label: "Total Farmers",
      value: totalFarmers,
      change: `${totalFarmers ? Math.round((statusByKey.GREEN / totalFarmers) * 100) : 0}% GREEN`,
      tone: "success",
    },
    {
      label: "Registered Dealers",
      value: registeredDealers,
      change: `${pendingDealers} pending`,
      tone: "primary",
    },
    {
      label: "Status Votes",
      value: statusVotes,
      change: `${currentMonthVotes} this month`,
      tone: "warning",
    },
    {
      label: "Blacklist Entries",
      value: blacklistEntries,
      change: `${greenBlacklistedRow ? 1 : 0} green + blacklist`,
      tone: "danger",
    },
  ];

  const statusDistribution = [
    { name: "Green", value: statusByKey.GREEN, color: "#16A34A" },
    { name: "Yellow", value: statusByKey.YELLOW, color: "#F59E0B" },
    { name: "Red", value: statusByKey.RED, color: "#DC2626" },
  ];

  return {
    analytics,
    monthlyActivity,
    statusDistribution,
    recentFarmers: farmerRows,
    greenBlacklisted: greenBlacklistedRow,
  };
};

module.exports = { getDashboardSummary };
