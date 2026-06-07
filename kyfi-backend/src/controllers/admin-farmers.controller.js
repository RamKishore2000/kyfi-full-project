const { getAdminFarmers, getAdminFarmerVotes } = require("../services/admin-farmers.service");

const listFarmers = async (req, res, next) => {
  try {
    const farmers = await getAdminFarmers({
      farmerType: req.query.farmerType,
    });

    return res.status(200).json({
      farmers,
      total: farmers.length,
      farmerType:
        String(req.query.farmerType || "").trim().toUpperCase() === "NEW"
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
      total: votes.length,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { listFarmers, listFarmerVotes };
