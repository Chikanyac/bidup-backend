const mongoose = require("mongoose");

const auctionSchema = new mongoose.Schema({
  title: String,
  image: String,

  startingPrice: Number,
  currentPrice: Number,

  status: {
    type: String,
    default: "live" // live | ended
  },

  bidCount: {
    type: Number,
    default: 0
  },

  lastBidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  endTime: Date,

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Auction", auctionSchema);