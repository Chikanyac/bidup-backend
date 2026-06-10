const auth = require("./auth");

/**
 * Seller access middleware
 * (future: role-based control)
 */
function sellerAuth(req, res, next) {
  // safety check to avoid "handler must be a function" crash
  if (typeof auth !== "function") {
    console.error("auth middleware is not a function. Check auth.js export.");
    return res.status(500).json({ error: "Auth middleware misconfigured" });
  }

  auth(req, res, () => {
    // Future role check can go here
    // if (req.user.role !== "seller") {
    //   return res.status(403).json({ error: "Forbidden: sellers only" });
    // }

    next();
  });
}

module.exports = sellerAuth;