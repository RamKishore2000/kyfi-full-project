const {
  createFarmerStatus,
  findFarmerStatusByAadhaarOrMobile,
  searchFarmerStatuses,
  findFarmerStatusById,
  hasDealerVotedForFarmerStatus,
  getDealerFarmerStatusVoteColor,
  getFarmerStatusVoteBreakdown,
  voteFarmerStatus,
} = require("../services/farmer-status.service");

const maskAadhaar = (aadhaar) => {
  const digits = String(aadhaar || "").replace(/\D/g, "");
  return digits.length >= 4 ? `XXXX XXXX ${digits.slice(-4)}` : "XXXX XXXX XXXX";
};

const serializeFarmerStatus = (status) => ({
  id: status.id,
  aadhaar: status.aadhaar || null,
  aadhaarMasked: status.aadhaar ? maskAadhaar(status.aadhaar) : null,
  farmerName: status.farmer_name,
  mobileNumber: status.mobile_number,
  district: status.district,
  mandal: status.mandal,
  village: status.village,
  statusColor: status.status_color,
  rationCardNumber: status.ration_card_number,
  address: status.address,
  amountPending: status.amount_pending,
  remarks: status.remarks,
  createdByDealerId: status.created_by_dealer_id,
  voteCount: status.vote_count,
  createdAt: status.created_at,
  updatedAt: status.updated_at,
  blacklistReason: status.blacklist_reason || null,
  blacklisted: Boolean(status.blacklist_reason),
  blacklistEntryId: status.blacklist_entry_id || null,
});

const buildFarmerStatusPayload = async (status, dealerId) => {
  const serialized = serializeFarmerStatus(status);
  const currentDealerVoted = dealerId
    ? await hasDealerVotedForFarmerStatus({ statusId: status.id, dealerId })
    : false;
  const currentDealerVoteColor = dealerId
    ? await getDealerFarmerStatusVoteColor({ statusId: status.id, dealerId })
    : null;
  const voteBreakdown = await getFarmerStatusVoteBreakdown(status.id);

  return {
    ...serialized,
    currentDealerVoted,
    currentDealerVoteColor,
    canVote: !currentDealerVoted,
    voteBreakdown,
  };
};

const checkFarmerStatus = async (req, res, next) => {
  const { aadhaar, mobileNumber } = req.body || {};

  if (!aadhaar && !mobileNumber) {
    return res.status(400).json({
      message: "Aadhaar number or mobile number is required",
    });
  }

  try {
    const farmerStatus = await findFarmerStatusByAadhaarOrMobile({
      aadhaar: aadhaar ? String(aadhaar).trim() : "",
      mobileNumber: mobileNumber ? String(mobileNumber).trim() : "",
    });

    return res.status(200).json({
      exists: Boolean(farmerStatus),
      farmerStatus: farmerStatus ? await buildFarmerStatusPayload(farmerStatus, req.user?.dealerId) : null,
    });
  } catch (error) {
    return next(error);
  }
};

const searchFarmerStatus = async (req, res, next) => {
  const { term, mandal, village, farmer_name, farmerName } = req.body || {};
  const normalizedTerm = String(term || "").trim();
  const normalizedMandal = String(mandal || "").trim();
  const normalizedVillage = String(village || "").trim();
  const normalizedFarmerName = String(farmer_name || farmerName || "").trim();

  if (!normalizedTerm && !normalizedMandal && !normalizedVillage && !normalizedFarmerName) {
    return res.status(400).json({
      message: "Mandal, village, or farmer name is required",
    });
  }

  try {
    const farmerStatuses = await searchFarmerStatuses({
      term: normalizedTerm,
      mandal: normalizedMandal,
      village: normalizedVillage,
      farmerName: normalizedFarmerName,
    });

    return res.status(200).json({
      results: await Promise.all(
        farmerStatuses.map((status) => buildFarmerStatusPayload(status, req.user?.dealerId)),
      ),
    });
  } catch (error) {
    return next(error);
  }
};

const addFarmerStatus = async (req, res, next) => {
  const {
    aadhaar,
    farmerName,
    mobileNumber,
    district,
    mandal,
    village,
    statusColor,
    rationCardNumber,
    address,
    amountPending,
    remarks,
  } = req.body || {};

  const dealerId = req.user?.dealerId;
  const dealerStatus = req.user?.status;

  if (dealerStatus && dealerStatus !== "approved") {
    return res.status(403).json({
      message: "Only approved dealers can add farmer status",
    });
  }

  if (!dealerId) {
    return res.status(401).json({
      message: "Authorization token required",
    });
  }

  if (
    !farmerName ||
    !district ||
    !mandal ||
    !village ||
    !statusColor
  ) {
    return res.status(400).json({
      message: "Required farmer status fields are missing",
    });
  }

  try {
    const existingFarmer = await findFarmerStatusByAadhaarOrMobile({
      aadhaar: aadhaar ? String(aadhaar).trim() : "",
      mobileNumber: mobileNumber ? String(mobileNumber).trim() : "",
    });

    if (existingFarmer) {
      return res.status(409).json({
        message: "Farmer status already exists",
        exists: true,
        farmerStatus: await buildFarmerStatusPayload(existingFarmer, dealerId),
      });
    }

    const farmerStatus = await createFarmerStatus({
      aadhaar: aadhaar ? String(aadhaar).trim() : "",
      farmerName: String(farmerName).trim(),
      mobileNumber: mobileNumber ? String(mobileNumber).trim() : "",
      district: String(district).trim(),
      mandal: String(mandal).trim(),
      village: String(village).trim(),
      statusColor: String(statusColor).trim().toUpperCase(),
      rationCardNumber: rationCardNumber ? String(rationCardNumber).trim() : "",
      address: address ? String(address).trim() : "",
      amountPending:
        amountPending !== undefined && amountPending !== null && String(amountPending).trim() !== ""
          ? Number(amountPending)
          : null,
      remarks: remarks ? String(remarks).trim() : "",
      createdByDealerId: dealerId,
    });

    return res.status(201).json({
      message: "Farmer status created successfully",
      farmerStatus: await buildFarmerStatusPayload(farmerStatus, dealerId),
    });
  } catch (error) {
    return next(error);
  }
};

const voteFarmerStatusById = async (req, res, next) => {
  const dealerId = req.user?.dealerId;
  const statusId = Number(req.params.id);
  const voteColor = String(req.body?.voteColor || "").trim().toUpperCase();

  if (!dealerId) {
    return res.status(401).json({ message: "Authorization token required" });
  }

  if (!Number.isFinite(statusId)) {
    return res.status(400).json({ message: "Invalid farmer status id" });
  }

  if (!["GREEN", "YELLOW", "RED"].includes(voteColor)) {
    return res.status(400).json({ message: "Vote color is required" });
  }

  try {
    const statusBeforeVote = await findFarmerStatusById(statusId);
    const result = await voteFarmerStatus({
      statusId,
      dealerId,
      voteColor,
      createdByDealerId: statusBeforeVote?.created_by_dealer_id,
    });
    const updatedFarmerStatus = await findFarmerStatusById(statusId);
    const message =
      result?.action === "locked"
        ? "You can update your vote. Removal is not allowed."
        : result?.action === "removed"
        ? "Your vote has been removed."
        : "Your vote has been applied.";

    return res.status(200).json({
      message,
      farmerStatus: updatedFarmerStatus ? await buildFarmerStatusPayload(updatedFarmerStatus, dealerId) : null,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  checkFarmerStatus,
  searchFarmerStatus,
  addFarmerStatus,
  voteFarmerStatusById,
};
