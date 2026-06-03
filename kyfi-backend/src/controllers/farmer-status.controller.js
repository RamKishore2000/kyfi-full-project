const {
  createFarmerStatus,
  findFarmerStatusByAadhaarOrMobile,
  searchFarmerStatuses,
  findFarmerStatusById,
  hasDealerVotedForFarmerStatus,
  getDealerFarmerStatusVoteColor,
  getFarmerStatusVoteBreakdown,
  getDealerFarmerStatusCountAction,
  changeFarmerStatusCount,
  voteFarmerStatus,
} = require("../services/farmer-status.service");
const {
  findMandalById,
  findVillageById,
} = require("../services/location.service");

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
  farmerType: status.farmer_type,
  district: status.district,
  mandal: status.mandal,
  village: status.village,
  districtId: status.district_id ? Number(status.district_id) : null,
  mandalId: status.mandal_id ? Number(status.mandal_id) : null,
  villageId: status.village_id ? Number(status.village_id) : null,
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
  const currentDealerCountAction = dealerId
    ? await getDealerFarmerStatusCountAction({ statusId: status.id, dealerId })
    : null;
  const voteBreakdown = await getFarmerStatusVoteBreakdown(status.id);
  const isNewFarmer = String(status.farmer_type || "").toUpperCase() === "NEW";
  const isStatusOwner = dealerId ? Number(status.created_by_dealer_id) === Number(dealerId) : false;
  const canManageStatus = !isNewFarmer || isStatusOwner;

  return {
    ...serialized,
    currentDealerVoted,
    currentDealerVoteColor,
    currentDealerCountAction,
    canIncrement: canManageStatus && currentDealerCountAction !== "INCREMENT",
    canDecrement: canManageStatus && currentDealerCountAction === "INCREMENT",
    canManageStatus,
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
      dealerId: req.user?.dealerId,
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
    farmerType,
    farmerName,
    mobileNumber,
    mandal,
    village,
    districtId,
    mandalId,
    villageId,
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

  if (!farmerName || !mandalId || !villageId || !statusColor) {
    return res.status(400).json({
      message: "Required farmer status fields are missing",
    });
  }

  try {
    const selectedMandalId = Number(mandalId);
    const selectedVillageId = Number(villageId);

    if (!Number.isFinite(selectedMandalId) || selectedMandalId <= 0) {
      return res.status(400).json({ message: "Invalid mandal selection" });
    }

    if (!Number.isFinite(selectedVillageId) || selectedVillageId <= 0) {
      return res.status(400).json({ message: "Invalid village selection" });
    }

    const selectedMandal = await findMandalById(selectedMandalId);
    if (!selectedMandal) {
      return res.status(400).json({ message: "Selected mandal was not found" });
    }

    const selectedVillage = await findVillageById(selectedVillageId);
    if (!selectedVillage) {
      return res.status(400).json({ message: "Selected village was not found" });
    }

    if (Number(selectedVillage.mandal_id) !== Number(selectedMandalId)) {
      return res.status(400).json({ message: "Village does not belong to the selected mandal" });
    }

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
      farmerType: farmerType ? String(farmerType).trim() : "OLD",
      farmerName: String(farmerName).trim(),
      mobileNumber: mobileNumber ? String(mobileNumber).trim() : "",
      district: String(selectedMandal.district_name || "").trim(),
      mandal: String(selectedMandal.mandal_name || mandal || "").trim(),
      village: String(selectedVillage.village_name || village || "").trim(),
      districtId: selectedMandal.district_id ? Number(selectedMandal.district_id) : null,
      mandalId: selectedMandalId,
      villageId: selectedVillageId,
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
    const isNewFarmer = String(statusBeforeVote?.farmer_type || "").toUpperCase() === "NEW";
    if (
      isNewFarmer &&
      Number(statusBeforeVote?.created_by_dealer_id || 0) !== Number(dealerId)
    ) {
      return res.status(403).json({ message: "Only the dealer who added this new farmer can change the status" });
    }
    const result = await voteFarmerStatus({
      statusId,
      dealerId,
      voteColor,
      createdByDealerId: statusBeforeVote?.created_by_dealer_id,
    });
    const updatedFarmerStatus = await findFarmerStatusById(statusId);
    const message =
      isNewFarmer && result?.action === "locked"
        ? "This status is already active."
        : isNewFarmer && (result?.action === "added" || result?.action === "updated" || result?.action === "restored")
        ? "Status updated successfully."
        : result?.action === "locked"
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

const incrementFarmerStatusCountById = async (req, res, next) => {
  const dealerId = req.user?.dealerId;
  const statusId = Number(req.params.id);

  if (!dealerId) {
    return res.status(401).json({ message: "Authorization token required" });
  }

  if (!Number.isFinite(statusId)) {
    return res.status(400).json({ message: "Invalid farmer status id" });
  }

  try {
    const statusBeforeAction = await findFarmerStatusById(statusId);
    if (
      String(statusBeforeAction?.farmer_type || "").toUpperCase() === "NEW" &&
      Number(statusBeforeAction?.created_by_dealer_id || 0) !== Number(dealerId)
    ) {
      return res.status(403).json({ message: "Only the dealer who added this new farmer can change the status" });
    }
    const result = await changeFarmerStatusCount({
      statusId,
      dealerId,
      actionType: "INCREMENT",
    });
    const updatedFarmerStatus = await findFarmerStatusById(statusId);

    const message =
      result?.action === "locked"
        ? "You already increased this farmer count."
        : result?.action === "restored"
        ? "Farmer count increased again."
        : "Farmer count increased.";

    return res.status(200).json({
      message,
      farmerStatus: updatedFarmerStatus ? await buildFarmerStatusPayload(updatedFarmerStatus, dealerId) : null,
    });
  } catch (error) {
    return next(error);
  }
};

const decrementFarmerStatusCountById = async (req, res, next) => {
  const dealerId = req.user?.dealerId;
  const statusId = Number(req.params.id);

  if (!dealerId) {
    return res.status(401).json({ message: "Authorization token required" });
  }

  if (!Number.isFinite(statusId)) {
    return res.status(400).json({ message: "Invalid farmer status id" });
  }

  try {
    const statusBeforeAction = await findFarmerStatusById(statusId);
    if (
      String(statusBeforeAction?.farmer_type || "").toUpperCase() === "NEW" &&
      Number(statusBeforeAction?.created_by_dealer_id || 0) !== Number(dealerId)
    ) {
      return res.status(403).json({ message: "Only the dealer who added this new farmer can change the status" });
    }
    const result = await changeFarmerStatusCount({
      statusId,
      dealerId,
      actionType: "DECREMENT",
    });
    const updatedFarmerStatus = await findFarmerStatusById(statusId);

    const message =
      result?.action === "locked"
        ? "You need to increase the count before decreasing it."
        : "Farmer count decreased.";

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
  incrementFarmerStatusCountById,
  decrementFarmerStatusCountById,
};
