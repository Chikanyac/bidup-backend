const router = require("express").Router();
const Auction = require("../models/Auction");

// =======================
// GET LIVE AUCTIONS
// =======================
router.get("/", async (req, res) => {
  try {
    const auctions = await Auction.find({ status: "live" }).sort({ createdAt: -1 });

    res.json(auctions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load auctions" });
  }
});

module.exports = router;