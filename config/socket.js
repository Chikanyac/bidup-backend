let ioInstance = null;

const Auction = require("../models/Auction");

function initSocket(io) {
  ioInstance = io;

  io.on("connection", async (socket) => {
    console.log("🔌 USER CONNECTED:", socket.id);

    /* =====================
       SEND LIVE AUCTIONS
    ====================== */
    socket.on("getLiveAuctions", async () => {
      const auctions = await Auction.find({ status: "live" });
      socket.emit("initAuctions", auctions);
    });

    /* =====================
       JOIN ROOM
    ====================== */
    socket.on("joinAuction", (auctionId) => {
      socket.join(auctionId);
    });

    /* =====================
       PLACE BID (CORE LOGIC)
    ====================== */
    socket.on("placeBid", async ({ auctionId, bidAmount, userId }) => {
      const auction = await Auction.findById(auctionId);
      if (!auction) return;

      if (auction.status !== "live") return;

      if (bidAmount <= auction.currentPrice) return;

      auction.currentPrice = bidAmount;
      auction.bidCount += 1;

      auction.lastBidder = userId;

      await auction.save();

      io.to(auctionId).emit("bidUpdated", {
        auctionId,
        currentPrice: auction.currentPrice,
        bidCount: auction.bidCount,
        lastBidder: userId
      });
    });

    socket.on("disconnect", () => {
      console.log("❌ DISCONNECTED:", socket.id);
    });
  });
}

module.exports = { initSocket };