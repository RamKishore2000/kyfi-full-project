const {
  createBlacklistEntry,
  findBlacklistEntryByAadhaar,
  searchBlacklistEntries,
  serializeBlacklistEntry,
} = require("../services/blacklist.service");

const buildBlacklistEntryPayload = (entry) => serializeBlacklistEntry(entry);

const checkBlacklistEntry = async (req, res, next) => {
  const { aadhaar } = req.body || {};

  if (!aadhaar) {
    return res.status(400).json({
      message: "Aadhaar number is required",
    });
  }

  try {
    const blacklistEntry = await findBlacklistEntryByAadhaar(String(aadhaar).trim());

    return res.status(200).json({
      exists: Boolean(blacklistEntry),
      blacklistEntry: blacklistEntry ? buildBlacklistEntryPayload(blacklistEntry) : null,
    });
  } catch (error) {
    return next(error);
  }
};

const addBlacklistEntry = async (req, res, next) => {
  const {
    aadhaar,
    farmerName,
    district,
    mandal,
    village,
    reason,
    address,
  } = req.body || {};

  const dealerId = req.user?.dealerId;
  const dealerStatus = req.user?.status;

  if (dealerStatus && dealerStatus !== "approved") {
    return res.status(403).json({
      message: "Only approved dealers can add blacklist entries",
    });
  }

  if (!dealerId) {
    return res.status(401).json({
      message: "Authorization token required",
    });
  }

  if (!aadhaar || !farmerName || !district || !mandal || !village || !reason) {
    return res.status(400).json({
      message: "Required blacklist fields are missing",
    });
  }

  try {
    const existingEntry = await findBlacklistEntryByAadhaar(String(aadhaar).trim());

    if (existingEntry) {
      return res.status(409).json({
        message: "Blacklist entry already exists",
        exists: true,
        blacklistEntry: buildBlacklistEntryPayload(existingEntry),
      });
    }

    const blacklistEntry = await createBlacklistEntry({
      aadhaar: String(aadhaar).trim(),
      farmerName: String(farmerName).trim(),
      district: String(district).trim(),
      mandal: String(mandal).trim(),
      village: String(village).trim(),
      reason: String(reason).trim(),
      address: address ? String(address).trim() : "",
      createdByDealerId: dealerId,
    });

    return res.status(201).json({
      message: "Blacklist entry added successfully",
      blacklistEntry: buildBlacklistEntryPayload(blacklistEntry),
    });
  } catch (error) {
    return next(error);
  }
};

const searchBlacklist = async (req, res, next) => {
  const { mandal, village } = req.body || {};

  try {
    const blacklistEntries = await searchBlacklistEntries({
      mandal: mandal ? String(mandal).trim() : "",
      village: village ? String(village).trim() : "",
    });

    return res.status(200).json({
      entries: blacklistEntries.map((entry) => buildBlacklistEntryPayload(entry)),
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  checkBlacklistEntry,
  addBlacklistEntry,
  searchBlacklist,
};
