const {
  getHeroBannerSettings,
  updateHeroBannerSettings,
} = require("../services/site-banner.service");

function buildBannerUrl(req, filePath) {
  if (!filePath) {
    return null;
  }

  const origin = `${req.protocol}://${req.get("host")}`;
  return `${origin}${filePath}`;
}

function mapBannerResponse(req, banner) {
  return {
    desktopImageUrl: buildBannerUrl(req, banner.desktopImagePath),
    mobileImageUrl: buildBannerUrl(req, banner.mobileImagePath),
    desktopImageName: banner.desktopImageName,
    mobileImageName: banner.mobileImageName,
    updatedByDealerId: banner.updatedByDealerId,
    createdAt: banner.createdAt,
    updatedAt: banner.updatedAt,
  };
}

async function getPublicHeroBanner(req, res, next) {
  try {
    const banner = await getHeroBannerSettings();

    return res.status(200).json({
      banner: mapBannerResponse(req, banner),
    });
  } catch (error) {
    return next(error);
  }
}

async function getAdminHeroBanner(req, res, next) {
  try {
    const banner = await getHeroBannerSettings();

    return res.status(200).json({
      banner: mapBannerResponse(req, banner),
    });
  } catch (error) {
    return next(error);
  }
}

async function updateAdminHeroBanner(req, res, next) {
  const { desktopImageDataUrl, mobileImageDataUrl } = req.body || {};
  const adminId = req.user?.dealerId || null;

  try {
    const banner = await updateHeroBannerSettings({
      desktopImageDataUrl: typeof desktopImageDataUrl === "string" ? desktopImageDataUrl : null,
      mobileImageDataUrl: typeof mobileImageDataUrl === "string" ? mobileImageDataUrl : null,
      updatedByDealerId: adminId,
    });

    return res.status(200).json({
      message: "Hero banner updated successfully",
      banner: mapBannerResponse(req, banner),
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getPublicHeroBanner,
  getAdminHeroBanner,
  updateAdminHeroBanner,
};
