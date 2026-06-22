const { verifyJwt } = require("../utils/jwt");
const {
  getAdminAccess,
  hasPermission,
  hasAnyPermission,
} = require("../services/admin-access.service");
const {
  findDealerByIdWithSubscriptionCheck,
  getDealerAccessState,
} = require("../services/dealer.service");

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const error = new Error("JWT secret is not configured");
    error.statusCode = 500;
    throw error;
  }
  return secret;
};

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return res.status(401).json({ message: "Authorization token required" });
  }

  try {
    const payload = verifyJwt(token, getJwtSecret());

    if (!payload) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    if (payload.role === "dealer") {
      const dealer = await findDealerByIdWithSubscriptionCheck(payload.dealerId);

      if (!dealer) {
        return res.status(401).json({
          success: false,
          code: "DEALER_NOT_FOUND",
          message: "Dealer account not found",
        });
      }

      const access = getDealerAccessState(dealer);

      if (access.accessStatus !== "allowed") {
        return res.status(403).json({
          success: false,
          code: "SUBSCRIPTION_REQUIRED",
          message:
            dealer.trial_status === "expired"
              ? "Your free trial has expired. Please subscribe to continue."
              : "Please subscribe to continue using KYFI.",
        });
      }

      const dealerStatus = String(dealer.status || "").toLowerCase();
      if (!access.trialActive && dealerStatus !== "approved") {
        const statusMessages = {
          pending:
            "Dealer account is pending. After admin approval, you will receive an SMS.",
          rejected:
            "Your dealer account was rejected. Please contact KYFI support.",
          suspended:
            "Your dealer account has been suspended. Please contact KYFI support.",
        };
        const statusCodes = {
          pending: "DEALER_PENDING",
          rejected: "DEALER_REJECTED",
          suspended: "DEALER_SUSPENDED",
        };

        return res.status(403).json({
          success: false,
          code: statusCodes[dealerStatus] || "DEALER_NOT_APPROVED",
          message:
            statusMessages[dealerStatus] ||
            "Your dealer account is not approved. Please contact KYFI support.",
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

  if (!token) {
    return res.status(401).json({ message: "Authorization token required" });
  }

  try {
    const payload = verifyJwt(token, getJwtSecret());

    if (!payload) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    if (payload.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

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
