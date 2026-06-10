const Auction = require("../models/Auction");
const Bid = require("../models/Bid");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// =======================
// CREATE AUCTION
// =======================
exports.createAuction = async (req, res) => {
  try {
    const {
      carId,
      title,
      startingPrice
    } = req.body;

    const image = req.file
      ? `/uploads/vehicles/${req.file.filename}`
      : "";

    const auction = await Auction.create({
      carId,
      title,
      startingPrice,
      currentPrice: startingPrice,
      image,

      approved: false,      // Admin must approve
      status: "pending"
    });

    res.json({
      success: true,
      auction
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "Failed to create auction"
    });
  }
};

// =======================
// GET LIVE AUCTIONS
// =======================
exports.getAuctions = async (req, res) => {
  try {
    const auctions = await Auction.find({
      approved: true,
      status: "live"
    }).sort({ createdAt: -1 });

    res.json(auctions);

  } catch (err) {
    res.status(500).json({
      error: "Failed to load auctions"
    });
  }
};

// =======================
// PLACE BID
// =======================
exports.placeBid = async (req, res) => {
  try {

    const { carId, amount } = req.body;

    const token =
      req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        error: "No token"
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user =
      await User.findById(decoded.id);

    const auction =
      await Auction.findOne({ carId });

    if (!auction) {
      return res.status(404).json({
        error: "Auction not found"
      });
    }

    if (!auction.approved) {
      return res.status(403).json({
        error: "Auction not approved"
      });
    }

    if (auction.status !== "live") {
      return res.status(403).json({
        error: "Auction closed"
      });
    }

    if (amount <= auction.currentPrice) {
      return res.status(400).json({
        error: "Bid too low"
      });
    }

    auction.currentPrice = amount;

    await auction.save();

    await Bid.create({
      carId,
      price: amount,
      user: user.name
    });

    if (req.io) {
      req.io.emit("bidUpdate", {
        carId,
        price: amount,
        user: user.name
      });
    }

    console.log(
      `WhatsApp alert: ${user.name} bid $${amount}`
    );

    res.json({
      success: true
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      error: "Bid failed"
    });
  }
};