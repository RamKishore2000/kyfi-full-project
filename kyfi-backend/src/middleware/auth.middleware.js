const { verifyJwt } = require("../utils/jwt");
const {
  getAdminAccess,
  hasPermission,
  hasAnyPermission,
} = require("../services/admin-access.service");
const {
  findDealerByIdWithSubscriptionCheck,
} = require("../services/dealer.service");

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const secret = process.env.JWT_SECRET || "kyfi-secret-key";

  if (!token) {
    return res.status(401).json({ message: "Authorization token required" });
  }

  const payload = verifyJwt(token, secret);

  if (!payload) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  try {
    if (payload.role === "dealer") {
      const dealer = await findDealerByIdWithSubscriptionCheck(payload.dealerId);

      if (!dealer) {
        return res.status(401).json({
          success: false,
          code: "DEALER_NOT_FOUND",
          message: "Dealer account not found",
        });
      }

      if (dealer.subscription_status !== "active") {
        return res.status(403).json({
          success: false,
          code: "SUBSCRIPTION_EXPIRED",
          message: "Your subscription has expired. Please renew your plan.",
        });
      }

      req.dealer = dealer;
    }

    req.user = payload;
    return next();
  } catch (error) {
    return next(error);
  }
};

const requireAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const secret = process.env.JWT_SECRET || "kyfi-secret-key";

  if (!token) {
    return res.status(401).json({ message: "Authorization token required" });
  }

  const payload = verifyJwt(token, secret);

  if (!payload) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  if (payload.role !== "admin") {
    return res.status(403).json({ message: "Admin access only" });
  }

  try {
    const adminAccess = await getAdminAccess(payload.dealerId);

    if (!adminAccess) {
      return res.status(403).json({ message: "Admin account is not active" });
    }

    req.user = payload;
    req.admin = adminAccess;
    return next();
  } catch (error) {
    return next(error);
  }
};

const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!hasPermission(req.admin, permission)) {
      return res.status(403).json({ message: "Permission denied" });
    }

    return next();
  };
};

const requireAnyPermission = (permissions) => {
  return (req, res, next) => {
    if (!hasAnyPermission(req.admin, permissions)) {
      return res.status(403).json({ message: "Permission denied" });
    }

    return next();
  };
};

module.exports = {
  requireAuth,
  requireAdmin,
  requirePermission,
  requireAnyPermission,
};
