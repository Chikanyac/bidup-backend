const router = require("express").Router();

const adminAuth = require("../middleware/adminAuth");

const {
  getAllUsers,
  getAllAuctions,
  forceCloseAuction,
  approveAuction,
  rejectAuction,
  getDashboardStats
} = require("../controllers/adminController");

router.get("/users", adminAuth, getAllUsers);

router.get("/auctions", adminAuth, getAllAuctions);

router.get("/pending-auctions", adminAuth, async (req, res) => {
  try {
    const Auction = require("../models/Auction");

    const auctions = await Auction.find({ status: "pending" })
      .populate("seller", "name email")
      .sort({ createdAt: -1 });

    res.json(auctions);
  } catch (err) {
    res.status(500).json({ error: "Failed to load pending auctions" });
  }
});

router.post("/auction/:id/approve", adminAuth, approveAuction);
router.post("/auction/:id/reject", adminAuth, rejectAuction);
router.post("/auction/:id/close", adminAuth, forceCloseAuction);

router.get("/dashboard-stats", adminAuth, getDashboardStats);

module.exports = router;