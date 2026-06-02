const {
  createBlacklistEntry,
  createBlacklistReport,
  deleteBlacklistEntryById,
  deleteBlacklistReport,
  findBlacklistEntryById,
  findBlacklistEntryByAadhaar,
  findBlacklistEntryByMobileNumber,
  getBlacklistEntryReportStats,
  searchBlacklistEntries,
  serializeBlacklistEntry,
} = require("../services/blacklist.service");

const buildBlacklistEntryPayload = (entry) => serializeBlacklistEntry(entry);

const buildBlacklistEntryPayloadWithMeta = async (entry, dealerId) => {
  if (!entry) {
    return null;
  }

  const stats = await getBlacklistEntryReportStats({
    blacklistEntryId: entry.id,
    dealerId,
  });

  return buildBlacklistEntryPayload({
    ...entry,
    report_count: stats.reportCount,
    current_dealer_reported: stats.currentDealerReported,
  });
};

const checkBlacklistEntry = async (req, res, next) => {
  const { mobileNumber, mobile, aadhaar } = req.body || {};
  const normalizedMobileNumber = String(mobileNumber || mobile || aadhaar || "").trim();

  if (!normalizedMobileNumber) {
    return res.status(400).json({
      message: "Mobile number is required",
    });
  }

  try {
    const blacklistEntry =
      (await findBlacklistEntryByMobileNumber(normalizedMobileNumber)) ||
      (aadhaar ? await findBlacklistEntryByAadhaar(String(aadhaar).trim()) : null);

    return res.status(200).json({
      exists: Boolean(blacklistEntry),
      blacklistEntry: blacklistEntry
        ? await buildBlacklistEntryPayloadWithMeta(blacklistEntry, req.user?.dealerId)
        : null,
    });
  } catch (error) {
    return next(error);
  }
};

const addBlacklistEntry = async (req, res, next) => {
  const {
    mobileNumber,
    mobile,
    aadhaar,
    farmerName,
    mandal,
    village,
    reason,
    address,
  } = req.body || {};
  const normalizedMobileNumber = String(mobileNumber || mobile || aadhaar || "").trim();
  const normalizedAadhaar = String(aadhaar || "").trim();

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

  if (!normalizedMobileNumber || !farmerName || !mandal || !village || !reason) {
    return res.status(400).json({
      message: "Required blacklist fields are missing",
    });
  }

  try {
    const existingEntry =
      (await findBlacklistEntryByMobileNumber(normalizedMobileNumber)) ||
      (normalizedAadhaar ? await findBlacklistEntryByAadhaar(normalizedAadhaar) : null);

    if (existingEntry) {
      const stats = await getBlacklistEntryReportStats({
        blacklistEntryId: existingEntry.id,
        dealerId,
      });

      if (stats.currentDealerReported) {
        return res.status(200).json({
          message: "You have already added this farmer to the blacklist",
          exists: true,
          blacklistEntry: await buildBlacklistEntryPayloadWithMeta(existingEntry, dealerId),
        });
      }

      return res.status(409).json({
        message: "This farmer has already been added to the blacklist by another dealer.",
        exists: true,
        blacklistEntry: await buildBlacklistEntryPayloadWithMeta(existingEntry, dealerId),
      });
    }

    const blacklistEntry = await createBlacklistEntry({
      aadhaar: normalizedAadhaar.length === 12 ? normalizedAadhaar : null,
      mobileNumber: normalizedMobileNumber,
      farmerName: String(farmerName).trim(),
      district: req.body?.district ? String(req.body.district).trim() : null,
      mandal: String(mandal).trim(),
      village: String(village).trim(),
      reason: String(reason).trim(),
      address: address ? String(address).trim() : "",
      createdByDealerId: dealerId,
    });

    await createBlacklistReport({
      blacklistEntryId: blacklistEntry.id,
      dealerId,
    });

    return res.status(201).json({
      message: "Blacklist entry added successfully",
      blacklistEntry: await buildBlacklistEntryPayloadWithMeta(blacklistEntry, dealerId),
    });
  } catch (error) {
    return next(error);
  }
};

const reportBlacklistEntry = async (req, res, next) => {
  const dealerId = req.user?.dealerId;
  const dealerStatus = req.user?.status;
  const entryId = Number(req.params.id);

  if (dealerStatus && dealerStatus !== "approved") {
    return res.status(403).json({
      message: "Only approved dealers can add blacklist reports",
    });
  }

  if (!dealerId) {
    return res.status(401).json({
      message: "Authorization token required",
    });
  }

  if (!Number.isFinite(entryId) || entryId <= 0) {
    return res.status(400).json({
      message: "Valid blacklist entry id is required",
    });
  }

  try {
    const existingEntry = await findBlacklistEntryById(entryId);

    if (!existingEntry) {
      return res.status(404).json({
        message: "Blacklist entry not found",
      });
    }

    const stats = await getBlacklistEntryReportStats({
      blacklistEntryId: entryId,
      dealerId,
    });

    if (stats.currentDealerReported) {
      return res.status(200).json({
        message: "Blacklist report already recorded",
        blacklistEntry: await buildBlacklistEntryPayloadWithMeta(existingEntry, dealerId),
      });
    }

    await createBlacklistReport({
      blacklistEntryId: entryId,
      dealerId,
    });

    return res.status(200).json({
      message: "Blacklist report added successfully",
      blacklistEntry: await buildBlacklistEntryPayloadWithMeta(existingEntry, dealerId),
    });
  } catch (error) {
    if (error && error.code === "ER_DUP_ENTRY") {
      const existingEntry = await findBlacklistEntryById(entryId);
      return res.status(200).json({
        message: "Blacklist report already recorded",
        blacklistEntry: existingEntry
          ? await buildBlacklistEntryPayloadWithMeta(existingEntry, dealerId)
          : null,
      });
    }

    return next(error);
  }
};

const removeBlacklistReport = async (req, res, next) => {
  const dealerId = req.user?.dealerId;
  const dealerStatus = req.user?.status;
  const entryId = Number(req.params.id);

  if (dealerStatus && dealerStatus !== "approved") {
    return res.status(403).json({
      message: "Only approved dealers can remove blacklist reports",
    });
  }

  if (!dealerId) {
    return res.status(401).json({
      message: "Authorization token required",
    });
  }

  if (!Number.isFinite(entryId) || entryId <= 0) {
    return res.status(400).json({
      message: "Valid blacklist entry id is required",
    });
  }

  try {
    const existingEntry = await findBlacklistEntryById(entryId);

    if (!existingEntry) {
      return res.status(404).json({
        message: "Blacklist entry not found",
      });
    }

    const stats = await getBlacklistEntryReportStats({
      blacklistEntryId: entryId,
      dealerId,
    });

    if (!stats.currentDealerReported) {
      return res.status(404).json({
        message: "Blacklist report not found for current dealer",
        blacklistEntry: await buildBlacklistEntryPayloadWithMeta(existingEntry, dealerId),
      });
    }

    const removed = await deleteBlacklistReport({
      blacklistEntryId: entryId,
      dealerId,
    });

    if (!removed) {
      return res.status(404).json({
        message: "Blacklist report not found for current dealer",
        blacklistEntry: await buildBlacklistEntryPayloadWithMeta(existingEntry, dealerId),
      });
    }

    if ((stats.reportCount || 0) <= 1) {
      await deleteBlacklistEntryById(entryId);
      return res.status(200).json({
        message: "Blacklist entry removed successfully",
        deleted: true,
        blacklistEntry: null,
      });
    }

    return res.status(200).json({
      message: "Blacklist report removed successfully",
      blacklistEntry: await buildBlacklistEntryPayloadWithMeta(existingEntry, dealerId),
    });
  } catch (error) {
    return next(error);
  }
};

const searchBlacklist = async (req, res, next) => {
  const { mandal, village } = req.body || {};
  const dealerId = req.user?.dealerId;

  try {
    const blacklistEntries = await searchBlacklistEntries({
      mandal: mandal ? String(mandal).trim() : "",
      village: village ? String(village).trim() : "",
    });

    const entries = await Promise.all(
      blacklistEntries.map((entry) => buildBlacklistEntryPayloadWithMeta(entry, dealerId)),
    );

    return res.status(200).json({
      entries,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  checkBlacklistEntry,
  addBlacklistEntry,
  reportBlacklistEntry,
  removeBlacklistReport,
  searchBlacklist,
};
