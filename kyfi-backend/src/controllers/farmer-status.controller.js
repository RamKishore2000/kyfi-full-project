const {
  createFarmerStatus,
  findFarmerStatusByAadhaarOrMobile,
  searchFarmerStatuses,
  findFarmerStatusById,
  hasDealerVotedForFarmerStatus,
  voteFarmerStatus,
} = require("../services/farmer-status.service");

const maskAadhaar = (aadhaar) => {
  const digits = String(aadhaar || "").replace(/\D/g, "");
  return digits.length >= 4 ? `XXXX XXXX ${digits.slice(-4)}` : "XXXX XXXX XXXX";
};

const serializeFarmerStatus = (status) => ({
  id: status.id,
  aadhaar: status.aadhaar,
  aadhaarMasked: maskAadhaar(status.aadhaar),
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

  return {
    ...serialized,
    currentDealerVoted,
    canVote: !currentDealerVoted,
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
  const { term } = req.body || {};

  if (!term || !String(term).trim()) {
    return res.status(400).json({
      message: "Search term is required",
    });
  }

  try {
    const farmerStatuses = await searchFarmerStatuses({
      term: String(term).trim(),
    });

    return res.status(200).json({
      results: farmerStatuses.map((status) => serializeFarmerStatus(status)),
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
    !aadhaar ||
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
      aadhaar: String(aadhaar).trim(),
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
      aadhaar: String(aadhaar).trim(),
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

  if (!dealerId) {
    return res.status(401).json({ message: "Authorization token required" });
  }

  if (!Number.isFinite(statusId)) {
    return res.status(400).json({ message: "Invalid farmer status id" });
  }

  try {
    await voteFarmerStatus({ statusId, dealerId });
    const updatedFarmerStatus = await findFarmerStatusById(statusId);

    return res.status(200).json({
      message: "Vote recorded successfully",
      farmerStatus: updatedFarmerStatus ? await buildFarmerStatusPayload(updatedFarmerStatus, dealerId) : null,
    });
  } catch (error) {
    if (error && error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "You can vote only once for this farmer record",
      });
    }

    return next(error);
  }
};

module.exports = {
  checkFarmerStatus,
  searchFarmerStatus,
  addFarmerStatus,
  voteFarmerStatusById,
};
