const Auction = require("../models/Auction");
const Bid = require("../models/Bid");

async function closeExpiredAuctions(io) {
  const now = new Date();

  const expired = await Auction.find({
    status: "live",
    endsAt: { $lte: now }
  });

  for (const auction of expired) {

    const topBid = await Bid.findOne({ carId: auction.carId })
      .sort({ price: -1 });

    auction.status = "closed";

    if (topBid) {
      auction.winner = {
        user: topBid.user,
        amount: topBid.price
      };
    }

    await auction.save();

    io.emit("auctionClosed", {
      carId: auction.carId,
      winner: auction.winner || null
    });
  }
}

module.exports = {
  closeExpiredAuctions
};