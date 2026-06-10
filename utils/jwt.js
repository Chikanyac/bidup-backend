const jwt = require("jsonwebtoken");

/**
 * Generate JWT for authenticated users
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role || "user"
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

/**
 * Verify JWT safely
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
}

module.exports = {
  generateToken,
  verifyToken
};