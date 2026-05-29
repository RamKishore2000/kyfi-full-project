const { getAdminFarmers } = require("../services/admin-farmers.service");

const listFarmers = async (req, res, next) => {
  try {
    const farmers = await getAdminFarmers();

    return res.status(200).json({
      farmers,
      total: farmers.length,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { listFarmers };
