const User = require("../models/User");
const Auction = require("../models/Auction");

// =======================
// GET USERS
// =======================
async function getAllUsers(req, res) {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to load users" });
  }
}


// =======================
// GET ALL AUCTIONS (ADMIN DASHBOARD READY)
// =======================
async function getAllAuctions(req, res) {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status) query.status = status;

    const auctions = await Auction.find(query)
      .populate("seller", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Auction.countDocuments(query);

    res.json({
      data: auctions,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    });

  } catch (err) {
    res.status(500).json({ error: "Failed to load auctions" });
  }
}


// =======================
// FORCE CLOSE AUCTION
// =======================
async function forceCloseAuction(req, res) {
  try {
    const auction = await Auction.findById(req.params.id);

    if (!auction) {
      return res.status(404).json({ error: "Auction not found" });
    }

    auction.status = "closed";
    await auction.save();

    // real-time update
    req.io.emit("auctionClosed", auction);

    res.json({
      success: true,
      message: "Auction closed",
      auction
    });

  } catch (err) {
    res.status(500).json({ error: "Failed to close auction" });
  }
}


// =======================
// APPROVE AUCTION
// =======================
async function approveAuction(req, res) {
  try {
    const auction = await Auction.findById(req.params.id);

    if (!auction) {
      return res.status(404).json({ error: "Auction not found" });
    }

    auction.status = "live";
    auction.isApproved = true;
    auction.adminNotes = req.body?.adminNotes || "Approved by admin";
    auction.startsAt = new Date();

    await auction.save();

    req.io.emit("auctionApproved", auction);

    res.json({
      success: true,
      message: "Auction approved",
      auction
    });

  } catch (err) {
    res.status(500).json({ error: "Failed to approve auction" });
  }
}


// =======================
// REJECT AUCTION
// =======================
async function rejectAuction(req, res) {
  try {
    const auction = await Auction.findById(req.params.id);

    if (!auction) {
      return res.status(404).json({ error: "Auction not found" });
    }

    auction.status = "rejected";
    auction.isApproved = false;
    auction.adminNotes = req.body?.adminNotes || "Rejected by admin";

    await auction.save();

    req.io.emit("auctionRejected", auction);

    res.json({
      success: true,
      message: "Auction rejected"
    });

  } catch (err) {
    res.status(500).json({ error: "Failed to reject auction" });
  }
}


// =======================
// DASHBOARD STATS
// =======================
async function getDashboardStats(req, res) {
  try {
    const User = require("../models/User");
    const Auction = require("../models/Auction");

    const totalUsers = await User.countDocuments();
    const totalAuctions = await Auction.countDocuments();

    const liveAuctions = await Auction.countDocuments({ status: "live" });
    const pendingAuctions = await Auction.countDocuments({ status: "pending" });
    const closedAuctions = await Auction.countDocuments({ status: "closed" });

    res.json({
      totalUsers,
      totalAuctions,
      liveAuctions,
      pendingAuctions,
      closedAuctions
    });

  } catch (err) {
    res.status(500).json({ error: "Failed to load dashboard stats" });
  }
}


// =======================
// GET BID HISTORY FOR AUCTION
// =======================
async function getAuctionBids(req, res) {
  try {
    const { auctionId } = req.params;

    const bids = await Bid.find({ auction: auctionId })
      .populate("user", "name email")
      .sort({ amount: -1 });

    res.json(bids);

  } catch (err) {
    res.status(500).json({ error: "Failed to fetch bids" });
  }
}

module.exports = {
  getAuctionBids
};

const { finalizeAuctionWinner } = require("../services/auctionWinner");

async function forceCloseAuction(req, res) {
  try {
    const auctionId = req.params.id;

    const auction = await require("../models/Auction").findById(auctionId);

    if (!auction) {
      return res.status(404).json({ error: "Auction not found" });
    }

    await finalizeAuctionWinner(auctionId, req.io);

    res.json({
      success: true,
      message: "Auction closed and winner selected"
    });

  } catch (err) {
    res.status(500).json({ error: "Failed to close auction" });
  }
}

// =======================
// EXPORTS
// =======================
module.exports = {
  getAllUsers,
  getAllAuctions,
  forceCloseAuction,
  approveAuction,
  rejectAuction,
  getDashboardStats
};

const Bid = require("../models/Bid");