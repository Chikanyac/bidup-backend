const mongoose = require("mongoose");

const AuctionSchema = new mongoose.Schema(
  {
    carId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      default: ""
    },

    startingPrice: {
      type: Number,
      required: true,
      min: 0
    },

    currentPrice: {
      type: Number,
      required: true,
      min: 0
    },

    image: {
      type: String,
      default: ""
    },

    // =========================
    // SELLER RELATIONSHIP
    // =========================
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    sellerName: {
      type: String
    },

    // =========================
    // AUCTION STATE CONTROL
    // =========================
    status: {
      type: String,
      enum: ["pending", "live", "rejected", "closed"],
      default: "pending"
    },

    isApproved: {
      type: Boolean,
      default: false,
      index: true
    },

    adminNotes: {
      type: String,
      default: ""
    },

    // =========================
    // TIMING
    // =========================
    startsAt: {
      type: Date,
      default: Date.now
    },

    endsAt: {
      type: Date,
      default: () => Date.now() + 1000 * 60 * 30 // 30 mins
    },

    // =========================
    // WINNER DATA
    // =========================
    winner: {
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  amount: {
    type: Number,
    default: 0
  }
},

    // =========================
    // ANALYTICS (OPTIONAL V5)
    // =========================
    bidCount: {
      type: Number,
      default: 0
    },

    watchers: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// =========================
// INDEXES (PERFORMANCE)
// =========================
AuctionSchema.index({ status: 1, isApproved: 1 });
AuctionSchema.index({ endsAt: 1 });

// =========================
// EXPORT
// =========================
module.exports = mongoose.model("Auction", AuctionSchema);