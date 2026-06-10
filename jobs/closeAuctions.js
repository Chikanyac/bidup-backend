const Auction = require("../models/Auction");
const { finalizeAuctionWinner } = require("../services/auctionWinner");

function startAuctionClosingJob(io) {
  setInterval(async () => {
    try {
      const now = new Date();

      // find expired live auctions
      const expiredAuctions = await Auction.find({
        status: "live",
        endsAt: { $lte: now }
      });

      for (const auction of expiredAuctions) {
        await finalizeAuctionWinner(auction._id, io);
      }

    } catch (err) {
      console.error("Auto close job error:", err);
    }
  }, 15000); // every 15 seconds
}

module.exports = { startAuctionClosingJob };