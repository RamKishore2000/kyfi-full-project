const { verifyJwt } = require("../utils/jwt");

const requireAuth = (req, res, next) => {
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

  req.user = payload;
  return next();
};

const requireAdmin = (req, res, next) => {
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

  req.user = payload;
  return next();
};

module.exports = { requireAuth, requireAdmin };
