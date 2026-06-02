const { listDealerFarmerRecords } = require("../services/dealer-records.service");
const { serializeBlacklistEntry } = require("../services/blacklist.service");

const maskAadhaar = (aadhaar) => {
  const digits = String(aadhaar || "").replace(/\D/g, "");

  return digits.length >= 4 ? `XXXX XXXX ${digits.slice(-4)}` : "XXXX XXXX XXXX";
};

const serializeFarmerStatusRecord = (record) => ({
  id: record.id,
  aadhaar: record.aadhaar,
  aadhaarMasked: maskAadhaar(record.aadhaar),
  farmerName: record.farmer_name,
  mobileNumber: record.mobile_number,
  district: record.district,
  mandal: record.mandal,
  village: record.village,
  statusColor: record.status_color,
  currentDealerVoteColor: record.current_dealer_vote_color || null,
  rationCardNumber: record.ration_card_number,
  address: record.address,
  amountPending: record.amount_pending,
  remarks: record.remarks,
  createdByDealerId: record.created_by_dealer_id,
  voteCount: record.vote_count,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
  blacklisted: false,
  blacklistReason: null,
});

const serializeDealerVoteRecord = (record) => ({
  id: record.id,
  statusId: record.status_id,
  dealerId: record.dealer_id,
  voteColor: record.vote_color,
  votedAt: record.voted_at,
  aadhaar: record.aadhaar,
  aadhaarMasked: maskAadhaar(record.aadhaar),
  farmerName: record.farmer_name,
  mobileNumber: record.mobile_number,
  district: record.district,
  mandal: record.mandal,
  village: record.village,
  statusColor: record.status_color,
  farmerCreatedAt: record.farmer_created_at,
  farmerUpdatedAt: record.farmer_updated_at,
});

const getCurrentDealerRecords = async (req, res, next) => {
  const dealerId = req.user?.dealerId;

  if (!dealerId) {
    return res.status(401).json({ message: "Authorization token required" });
  }

  try {
    const records = await listDealerFarmerRecords(dealerId);

    return res.status(200).json({
      counts: records.counts,
      farmerStatuses: records.farmerStatuses.map((status) => serializeFarmerStatusRecord(status)),
      blacklistEntries: records.blacklistEntries.map((entry) => serializeBlacklistEntry(entry)),
      votes: records.votes.map((vote) => serializeDealerVoteRecord(vote)),
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getCurrentDealerRecords };
