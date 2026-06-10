const auth = require("./auth");

/**
 * Admin-only middleware
 */
function adminAuth(req, res, next) {
  auth(req, res, () => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    next();
  });
}

module.exports = adminAuth;