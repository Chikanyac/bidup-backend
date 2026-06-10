const express = require("express");
const router = express.Router();

const sellerAuth = require("../middleware/sellerAuth");

const {
  createAuction,
  getSellerAuctions,
  getSellerStats
} = require("../controllers/sellerController");

// CREATE AUCTION
router.post("/auctions", sellerAuth, createAuction);

// GET SELLER AUCTIONS
router.get("/auctions", sellerAuth, getSellerAuctions);

// GET SELLER DASHBOARD STATS
router.get("/stats", sellerAuth, getSellerStats);

module.exports = router;