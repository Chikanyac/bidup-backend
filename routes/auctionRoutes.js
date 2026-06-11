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

router.post("/create", async (req, res) => {
  try {
    const { title, startingPrice, image } = req.body;

    const auction = new Auction({
      title,
      startingPrice,
      currentPrice: startingPrice,
      image,
      status: "live",
      bidCount: 0
    });

    await auction.save();

    req.io.emit("initAuctions", await Auction.find({ status: "live" }));

    res.json(auction);

  } catch (err) {
    res.status(500).json({ error: "Auction creation failed" });
  }
});

module.exports = router;
