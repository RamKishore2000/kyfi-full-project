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
  const mobileImages = [
    {
      url: buildBannerUrl(req, banner.mobileImagePath),
      name: banner.mobileImageName,
    },
    {
      url: buildBannerUrl(req, banner.mobileImagePath2),
      name: banner.mobileImageName2,
    },
    {
      url: buildBannerUrl(req, banner.mobileImagePath3),
      name: banner.mobileImageName3,
    },
  ];

  return {
    desktopImageUrl: buildBannerUrl(req, banner.desktopImagePath),
    mobileImageUrl: buildBannerUrl(req, banner.mobileImagePath),
    mobileImageUrls: mobileImages.map((image) => image.url).filter(Boolean),
    desktopImageName: banner.desktopImageName,
    mobileImageName: banner.mobileImageName,
    mobileImageNames: mobileImages.map((image) => image.name || null),
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
  const { desktopImageDataUrl, mobileImageDataUrl, mobileImageDataUrls } = req.body || {};
  const adminId = req.user?.dealerId || null;

  try {
    const banner = await updateHeroBannerSettings({
      desktopImageDataUrl: typeof desktopImageDataUrl === "string" ? desktopImageDataUrl : null,
      mobileImageDataUrl: typeof mobileImageDataUrl === "string" ? mobileImageDataUrl : null,
      mobileImageDataUrls: Array.isArray(mobileImageDataUrls)
        ? mobileImageDataUrls.map((item) => (typeof item === "string" ? item : null))
        : null,
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
