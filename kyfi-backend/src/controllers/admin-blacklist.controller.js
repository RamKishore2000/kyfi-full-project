const {
  getAdminBlacklistEntries,
  deleteBlacklistEntryById,
} = require("../services/admin-blacklist.service");

const listBlacklist = async (req, res, next) => {
  try {
    const entries = await getAdminBlacklistEntries();

    return res.status(200).json({
      entries,
      total: entries.length,
    });
  } catch (error) {
    return next(error);
  }
};

const removeBlacklist = async (req, res, next) => {
  const entryId = Number(req.params.id);

  if (!Number.isFinite(entryId)) {
    return res.status(400).json({ message: "Invalid blacklist entry id" });
  }

  try {
    const removed = await deleteBlacklistEntryById(entryId);

    if (!removed) {
      return res.status(404).json({ message: "Blacklist entry not found" });
    }

    return res.status(200).json({
      message: "Blacklist entry removed successfully",
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { listBlacklist, removeBlacklist };
