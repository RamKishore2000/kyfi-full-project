const { listMandals } = require("../services/mandal.service");

async function getMandals(req, res, next) {
  try {
    const stateName = typeof req.query.state === "string" ? req.query.state.trim() : "";
    const districtName = typeof req.query.district === "string" ? req.query.district.trim() : "";
    const query = typeof req.query.query === "string" ? req.query.query.trim() : "";

    const mandals = await listMandals({
      stateName: stateName || null,
      districtName: districtName || null,
      query: query || null,
    });

    return res.status(200).json({
      mandals: mandals.map((item) => ({
        id: item.id,
        stateName: item.state_name,
        districtName: item.district_name,
        mandalName: item.mandal_name,
        sourceLabel: item.source_label,
      })),
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getMandals,
};
