const {
  decrementOldFarmerSuperAdminVote,
  getAdminFarmers,
  getAdminFarmerVotes,
  incrementOldFarmerSuperAdminVote,
} = require("../services/admin-farmers.service");

const listFarmers = async (req, res, next) => {
  try {
    const farmers = await getAdminFarmers({
      farmerType: req.query.farmerType,
    });

    return res.status(200).json({
      farmers,
      total: farmers.length,
      farmerType:
        String(req.query.farmerType || "")
          .trim()
          .toUpperCase() === "NEW"
          ? "NEW"
          : "OLD",
    });
  } catch (error) {
    return next(error);
  }
};

const listFarmerVotes = async (req, res, next) => {
  try {
    const votes = await getAdminFarmerVotes(req.params.id);

    return res.status(200).json({
      votes,
      total: votes.reduce((sum, vote) => sum + Number(vote.voteCount || 1), 0),
    });
  } catch (error) {
    return next(error);
  }
};

const incrementSuperAdminVote = async (req, res, next) => {
  if (req.admin?.adminRole !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "Super Admin access only" });
  }

  try {
    const result = await incrementOldFarmerSuperAdminVote({
      statusId: req.params.id,
      adminId: req.admin.id,
      proofImageDataUrl: req.body?.proofImageDataUrl,
    });

    return res.status(200).json({
      message: "Vote added successfully",
      farmer: {
        statusId: Number(req.params.id),
        voteCount: result.voteCount,
        superAdminVoteCount: result.superAdminVoteCount,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const decrementSuperAdminVote = async (req, res, next) => {
  if (req.admin?.adminRole !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "Super Admin access only" });
  }

  try {
    const result = await decrementOldFarmerSuperAdminVote({
      statusId: req.params.id,
      adminId: req.admin.id,
    });

    return res.status(200).json({
      message: "Vote removed successfully",
      farmer: {
        statusId: Number(req.params.id),
        voteCount: result.voteCount,
        superAdminVoteCount: result.superAdminVoteCount,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listFarmers,
  listFarmerVotes,
  incrementSuperAdminVote,
  decrementSuperAdminVote,
};
