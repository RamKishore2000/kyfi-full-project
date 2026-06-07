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
    oldFarmersRows,
    newFarmersRows,
    dealerRows,
    oldVotesRows,
    statusRows,
    pendingDealerRows,
    currentMonthOldVoteRows,
    monthlyFarmerRows,
    recentFarmerRows,
  ] = await Promise.all([
    db.execute(
      `SELECT COUNT(*) AS total
       FROM (
         SELECT fs.mobile_number
         FROM farmer_statuses fs
         WHERE UPPER(COALESCE(fs.farmer_type, 'OLD')) = 'OLD'
           AND fs.mobile_number IS NOT NULL
           AND fs.mobile_number <> ''
         GROUP BY fs.mobile_number
       ) AS unique_old_farmers`,
    ),
    db.execute(
      `SELECT COUNT(*) AS total
       FROM (
         SELECT fs.aadhaar
         FROM farmer_statuses fs
         WHERE UPPER(COALESCE(fs.farmer_type, 'OLD')) = 'NEW'
           AND fs.aadhaar IS NOT NULL
           AND fs.aadhaar <> ''
         GROUP BY fs.aadhaar
       ) AS unique_new_farmers`,
    ),
    db.execute("SELECT COUNT(*) AS total FROM dealers WHERE role = 'dealer'"),
    db.execute(
      `SELECT COUNT(*) AS total
       FROM farmer_status_count_actions fsca
       INNER JOIN farmer_statuses fs ON fs.id = fsca.status_id
       WHERE fsca.action_type = 'INCREMENT'
         AND UPPER(COALESCE(fs.farmer_type, 'OLD')) = 'OLD'`,
    ),
    db.execute(
      `SELECT status, COUNT(*) AS total
       FROM (
         SELECT ranked.status_color AS status
         FROM (
           SELECT
             fs.mobile_number,
             fs.status_color,
             ROW_NUMBER() OVER (
               PARTITION BY fs.aadhaar
               ORDER BY fs.updated_at DESC, fs.created_at DESC, fs.id DESC
             ) AS rn
           FROM farmer_statuses fs
           WHERE UPPER(COALESCE(fs.farmer_type, 'OLD')) = 'NEW'
             AND fs.aadhaar IS NOT NULL
             AND fs.aadhaar <> ''
         ) AS ranked
         WHERE ranked.rn = 1
           AND ranked.status_color IS NOT NULL
       ) AS deduped_statuses
       GROUP BY status`,
    ),
    db.execute("SELECT COUNT(*) AS total FROM dealers WHERE role = 'dealer' AND status = 'pending'"),
    db.execute(
      `SELECT COUNT(*) AS total
       FROM farmer_status_count_actions fsca
       INNER JOIN farmer_statuses fs ON fs.id = fsca.status_id
       WHERE fsca.action_type = 'INCREMENT'
         AND UPPER(COALESCE(fs.farmer_type, 'OLD')) = 'OLD'
         AND fsca.created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`,
    ),
    db.execute(
      `SELECT ym, farmer_type, COUNT(*) AS total
       FROM (
         SELECT
           DATE_FORMAT(fs.created_at, '%Y-%m') AS ym,
           'OLD' AS farmer_type,
           fs.mobile_number AS duplicate_key
         FROM farmer_statuses fs
         WHERE fs.created_at >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 6 MONTH), '%Y-%m-01')
           AND UPPER(COALESCE(fs.farmer_type, 'OLD')) = 'OLD'
           AND fs.mobile_number IS NOT NULL
           AND fs.mobile_number <> ''
         GROUP BY ym, fs.mobile_number

         UNION ALL

         SELECT
           DATE_FORMAT(fs.created_at, '%Y-%m') AS ym,
           'NEW' AS farmer_type,
           fs.aadhaar AS duplicate_key
         FROM farmer_statuses fs
         WHERE fs.created_at >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 6 MONTH), '%Y-%m-01')
           AND UPPER(COALESCE(fs.farmer_type, 'OLD')) = 'NEW'
           AND fs.aadhaar IS NOT NULL
           AND fs.aadhaar <> ''
         GROUP BY ym, fs.aadhaar
       ) AS unique_monthly_farmers
       GROUP BY ym, farmer_type`,
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
         ranked.farmer_type,
         ranked.created_by_dealer_id,
         ranked.vote_count,
         ranked.created_at,
         ranked.updated_at,
         NULL AS blacklist_reason
       FROM (
         SELECT
           fs.*,
           ROW_NUMBER() OVER (
             PARTITION BY
               CASE
                 WHEN UPPER(COALESCE(fs.farmer_type, 'OLD')) = 'NEW' THEN fs.aadhaar
                 ELSE fs.mobile_number
               END
             ORDER BY fs.updated_at DESC, fs.created_at DESC, fs.id DESC
           ) AS rn
         FROM farmer_statuses fs
         WHERE (
           UPPER(COALESCE(fs.farmer_type, 'OLD')) = 'OLD'
           AND fs.mobile_number IS NOT NULL
           AND fs.mobile_number <> ''
         ) OR (
           UPPER(COALESCE(fs.farmer_type, 'OLD')) = 'NEW'
           AND fs.aadhaar IS NOT NULL
           AND fs.aadhaar <> ''
         )
       ) AS ranked
       WHERE ranked.rn = 1
       ORDER BY ranked.updated_at DESC
       LIMIT 10`,
    ),
  ]);

  const oldFarmers = Number(oldFarmersRows[0][0]?.total || 0);
  const newFarmers = Number(newFarmersRows[0][0]?.total || 0);
  const totalFarmers = oldFarmers + newFarmers;
  const registeredDealers = Number(dealerRows[0][0]?.total || 0);
  const oldFarmerVotes = Number(oldVotesRows[0][0]?.total || 0);
  const pendingDealers = Number(pendingDealerRows[0][0]?.total || 0);
  const currentMonthOldVotes = Number(currentMonthOldVoteRows[0][0]?.total || 0);

  const statusByKey = statusRows[0].reduce(
    (accumulator, row) => {
      accumulator[String(row.status || "").toUpperCase()] = Number(row.total || 0);
      return accumulator;
    },
    { GREEN: 0, YELLOW: 0, RED: 0 },
  );

  const months = getRecentMonths(7);
  const oldFarmersMonthMap = monthlyFarmerRows[0].reduce((accumulator, row) => {
    if (String(row.farmer_type).toUpperCase() === "OLD") {
      accumulator[row.ym] = Number(row.total || 0);
    }
    return accumulator;
  }, {});
  const newFarmersMonthMap = monthlyFarmerRows[0].reduce((accumulator, row) => {
    if (String(row.farmer_type).toUpperCase() === "NEW") {
      accumulator[row.ym] = Number(row.total || 0);
    }
    return accumulator;
  }, {});

  const monthlyActivity = months.map((month) => ({
    month: month.month,
    oldFarmers: oldFarmersMonthMap[month.key] || 0,
    newFarmers: newFarmersMonthMap[month.key] || 0,
    farmers: (oldFarmersMonthMap[month.key] || 0) + (newFarmersMonthMap[month.key] || 0),
    reports: newFarmersMonthMap[month.key] || 0,
    approvals: month.key === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`
      ? registeredDealers - pendingDealers
      : 0,
  }));

  const farmerRows = recentFarmerRows[0].map((row) => ({
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

  const analytics = [
    {
      label: "Old Farmers",
      value: oldFarmers,
      change: `${oldFarmerVotes} old votes`,
      tone: "success",
    },
    {
      label: "New Farmers",
      value: newFarmers,
      change: `${totalFarmers} total farmers`,
      tone: "primary",
    },
    {
      label: "Registered Dealers",
      value: registeredDealers,
      change: `${pendingDealers} pending`,
      tone: "primary",
    },
    {
      label: "Old Farmer Votes",
      value: oldFarmerVotes,
      change: `${currentMonthOldVotes} this month`,
      tone: "warning",
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
    counts: {
      oldFarmers,
      newFarmers,
      oldFarmerVotes,
      totalFarmers,
    },
  };
};

module.exports = { getDashboardSummary };


