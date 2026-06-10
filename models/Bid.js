const mongoose = require("mongoose");

const BidSchema = new mongoose.Schema(
  {
    auction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auction",
      required: true,
      index: true
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    isWinning: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Index for fast leader lookup
BidSchema.index({ auction: 1, amount: -1 });

module.exports = mongoose.model("Bid", BidSchema);