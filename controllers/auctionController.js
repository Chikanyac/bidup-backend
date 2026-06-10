const Auction = require("../models/Auction");

/* =====================
   CREATE AUCTION (ADMIN/SELLER)
===================== */
exports.createAuction = async (req, res) => {
  try {
    const { title, image, startingPrice, durationMinutes } = req.body;

    const endTime = new Date(Date.now() + durationMinutes * 60000);

    const auction = new Auction({
      title,
      image,
      startingPrice,
      currentPrice: startingPrice,
      endTime,
      status: "live"
    });

    await auction.save();

    res.json({ success: true, auction });

  } catch (err) {
    res.status(500).json({ error: "Failed to create auction" });
  }
};

/* =====================
   GET ALL AUCTIONS
===================== */
exports.getAuctions = async (req, res) => {
  try {
    const auctions = await Auction.find().sort({ createdAt: -1 });
    res.json(auctions);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch auctions" });
  }
};