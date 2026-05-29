const { getDashboardSummary } = require("../services/admin-dashboard.service");

const getAdminDashboard = async (req, res, next) => {
  try {
    const dashboard = await getDashboardSummary();

    return res.status(200).json({
      ...dashboard,
      summary: {
        totalFarmers: dashboard.analytics[0].value,
        registeredDealers: dashboard.analytics[1].value,
        statusVotes: dashboard.analytics[2].value,
        blacklistEntries: dashboard.analytics[3].value,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getAdminDashboard };
