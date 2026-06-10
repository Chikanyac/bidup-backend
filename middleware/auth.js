const { verifyToken } = require("../utils/jwt");
const User = require("../models/User");

/**
 * Standard JWT authentication middleware
 * Works for HTTP routes
 */
async function auth(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = header.split(" ")[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user;
    next();

  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({ error: "Auth failed" });
  }
}

module.exports = auth;