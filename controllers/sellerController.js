const Auction = require("../models/Auction");

// =======================
// CREATE AUCTION (SELLER)
// =======================
exports.createAuction = async (req, res) => {
  try {
    const sellerId = req.user?._id;

    const { carId, title, startingPrice, image } = req.body;

    if (!sellerId) {
      return res.status(401).json({ error: "Unauthorized: No seller found" });
    }

    if (!title || !startingPrice) {
      return res.status(400).json({
        error: "Title and starting price are required"
      });
    }

    const auction = new Auction({
      carId: carId || Date.now().toString(),
      title,
      startingPrice,
      currentPrice: startingPrice,
      image: image || "",
      seller: sellerId, // ✅ FIXED
      status: "pending",
      endsAt: new Date(Date.now() + 1000 * 60 * 30) // 30 minutes
    });

    await auction.save();

    return res.json({
      success: true,
      message: "Auction submitted for admin approval",
      auction
    });

  } catch (err) {
    console.error("🔥 CREATE AUCTION ERROR:", err);

    return res.status(500).json({
      error: "Failed to create auction",
      details: err.message
    });
  }
};


// =======================
// GET SELLER AUCTIONS
// =======================
exports.getSellerAuctions = async (req, res) => {
  try {
    const sellerId = req.user?._id;

    const auctions = await Auction.find({ seller: sellerId }) // ✅ FIXED
      .sort({ createdAt: -1 });

    res.json(auctions);

  } catch (err) {
    res.status(500).json({ error: "Failed to fetch auctions" });
  }
};


// =======================
// GET SELLER STATS
// =======================
exports.getSellerStats = async (req, res) => {
  try {
    const sellerId = req.user?._id;

    const totalAuctions = await Auction.countDocuments({ seller: sellerId });

    const activeAuctions = await Auction.countDocuments({
      seller: sellerId,
      status: "active"
    });

    const pendingAuctions = await Auction.countDocuments({
      seller: sellerId,
      status: "pending"
    });

    res.json({
      totalAuctions,
      activeAuctions,
      pendingAuctions
    });

  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};


// =======================
// UPDATE AUCTION
// =======================
exports.updateAuction = async (req, res) => {
  try {
    const sellerId = req.user?._id;
    const { id } = req.params;

    const auction = await Auction.findOne({
      _id: id,
      seller: sellerId // ✅ FIXED
    });

    if (!auction) {
      return res.status(404).json({ error: "Auction not found" });
    }

    const { title, image, startingPrice } = req.body;

    if (title) auction.title = title;
    if (image) auction.image = image;
    if (startingPrice) {
      auction.startingPrice = startingPrice;

      // keep currentPrice aligned if auction hasn't started
      if (auction.status === "pending") {
        auction.currentPrice = startingPrice;
      }
    }

    await auction.save();

    res.json({
      success: true,
      auction
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Update failed" });
  }
};