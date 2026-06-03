const {
  searchDistricts,
  listMandals,
  searchMandals,
  searchVillages,
  listVillagesByMandal,
  createMandal,
  createVillage,
} = require("../services/location.service");

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
        id: Number(item.id),
        stateName: item.state_name || null,
        districtName: item.district_name || null,
        mandalName: item.mandal_name,
        mandalCode: item.mandal_code || null,
        districtId: item.district_id ? Number(item.district_id) : null,
        sourceLabel: item.source_label || null,
      })),
    });
  } catch (error) {
    return next(error);
  }
}

async function searchMandalsHandler(req, res, next) {
  try {
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const mandals = await searchMandals({ query });

    return res.status(200).json({
      mandals,
    });
  } catch (error) {
    return next(error);
  }
}

async function searchVillagesHandler(req, res, next) {
  try {
    const mandalId = Number(req.query.mandalId || 0);
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";

    if (!Number.isFinite(mandalId) || mandalId <= 0) {
      return res.status(400).json({
        message: "mandalId is required",
      });
    }

    const villages = await searchVillages({ mandalId, query });

    return res.status(200).json({
      villages,
    });
  } catch (error) {
    return next(error);
  }
}

async function getVillagesByMandal(req, res, next) {
  try {
    const mandalId = Number(req.params.mandalId);

    if (!Number.isFinite(mandalId) || mandalId <= 0) {
      return res.status(400).json({
        message: "Invalid mandal id",
      });
    }

    const villages = await listVillagesByMandal({ mandalId });

    return res.status(200).json({
      villages,
    });
  } catch (error) {
    return next(error);
  }
}

async function searchDistrictsHandler(req, res, next) {
  try {
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const districts = await searchDistricts({ query });

    return res.status(200).json({
      districts,
    });
  } catch (error) {
    return next(error);
  }
}

async function addMandalHandler(req, res, next) {
  try {
    const districtId = Number(req.body?.districtId || 0);
    const mandalName = typeof req.body?.mandalName === "string" ? req.body.mandalName.trim() : "";
    const mandalCode = typeof req.body?.mandalCode === "string" ? req.body.mandalCode.trim() : "";

    if (!Number.isFinite(districtId) || districtId <= 0 || !mandalName) {
      return res.status(400).json({
        message: "districtId and mandalName are required",
      });
    }

    const mandal = await createMandal({
      districtId,
      mandalName,
      mandalCode: mandalCode || null,
    });

    return res.status(201).json({
      message: "Mandal added successfully",
      mandal: mandal
        ? {
            id: Number(mandal.id),
            name: mandal.mandal_name,
            mandalCode: mandal.mandal_code || null,
            districtId: mandal.district_id ? Number(mandal.district_id) : null,
            districtName: mandal.district_name || null,
            stateName: mandal.state_name || null,
          }
        : null,
    });
  } catch (error) {
    return next(error);
  }
}

async function addVillageHandler(req, res, next) {
  try {
    const mandalId = Number(req.body?.mandalId || 0);
    const villageName = typeof req.body?.villageName === "string" ? req.body.villageName.trim() : "";
    const villageCode = typeof req.body?.villageCode === "string" ? req.body.villageCode.trim() : "";

    if (!Number.isFinite(mandalId) || mandalId <= 0 || !villageName) {
      return res.status(400).json({
        message: "mandalId and villageName are required",
      });
    }

    const village = await createVillage({
      mandalId,
      villageName,
      villageCode: villageCode || null,
    });

    return res.status(201).json({
      message: "Village added successfully",
      village: village
        ? {
            id: Number(village.id),
            name: village.village_name,
            villageCode: village.village_code || null,
            mandalId: village.mandal_id ? Number(village.mandal_id) : null,
            districtId: village.district_id ? Number(village.district_id) : null,
            mandalName: village.mandal_name || null,
            districtName: village.district_name || null,
            stateName: village.state_name || null,
          }
        : null,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getMandals,
  searchMandalsHandler,
  searchVillagesHandler,
  getVillagesByMandal,
  searchDistrictsHandler,
  addMandalHandler,
  addVillageHandler,
};
