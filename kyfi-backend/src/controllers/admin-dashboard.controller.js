const { getDashboardSummary } = require("../services/admin-dashboard.service");

const getAdminDashboard = async (req, res, next) => {
  try {
    const dashboard = await getDashboardSummary();

    return res.status(200).json({
      ...dashboard,
      summary: {
        totalFarmers: dashboard.counts.totalFarmers,
        oldFarmers: dashboard.counts.oldFarmers,
        newFarmers: dashboard.counts.newFarmers,
        registeredDealers: dashboard.analytics.find((item) => item.label === "Registered Dealers")?.value || 0,
        oldFarmerVotes: dashboard.counts.oldFarmerVotes,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getAdminDashboard };


