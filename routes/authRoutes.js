const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// =======================
// REGISTER (FIXED + SAFE)
// =======================
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 🔒 VALIDATION (prevents 500 crashes)
    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email, and password are required"
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: "user"
    });

    await user.save();

    return res.json({
      success: true,
      message: "User registered successfully"
    });

  } catch (err) {
    console.error("❌ REGISTER ERROR:", err); // 🔥 important for Render logs

    return res.status(500).json({
      error: "Registration failed",
      details: err.message
    });
  }
});

// =======================
// LOGIN (FIXED + SAFE)
// =======================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 🔒 VALIDATION
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required"
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error("❌ LOGIN ERROR:", err); // 🔥 Render debugging

    return res.status(500).json({
      error: "Login failed",
      details: err.message
    });
  }
});

module.exports = router;