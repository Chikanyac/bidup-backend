const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../utils/jwt");

// REGISTER
async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashed,
      role: "buyer"
    });

    await user.save();

    return res.json({ success: true });

  } catch (err) {
    console.error("🔥 REGISTER ERROR FULL:", err);

    return res.status(500).json({
      error: "Register failed",
      details: err.message
    });
  }
}

// LOGIN
async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ error: "Invalid password" });
    }

    const token = generateToken(user);

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    return res.status(500).json({ error: "Login failed" });
  }
}

module.exports = {
  register,
  login
};