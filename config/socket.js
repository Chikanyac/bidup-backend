let ioInstance = null;
const Auction = require("../models/Auction");

const initSocket = (io) => {
  ioInstance = io;

  io.on("connection", (socket) => {
    console.log("🔌 Connected:", socket.id);

    // =====================
    // JOIN AUCTION ROOM
    // =====================
    socket.on("joinAuction", (auctionId) => {
      if (!auctionId) return;
      socket.join(auctionId);
    });

    // =====================
    // GET LIVE AUCTIONS (IMPORTANT FIX)
    // =====================
    socket.on("getLiveAuctions", async () => {
      try {
        const auctions = await Auction.find({ status: "live" });
        socket.emit("initAuctions", auctions);
      } catch (err) {
        console.error("Auction fetch error:", err);
      }
    });

    // =====================
    // PLACE BID
    // =====================
    socket.on("placeBid", async (data) => {
      try {
        const { auctionId, bidAmount, userId } = data;

        if (!auctionId || !bidAmount) {
          return socket.emit("bidError", "Invalid bid");
        }

        const auction = await Auction.findById(auctionId);
        if (!auction) return socket.emit("bidError", "Not found");

        if (bidAmount <= auction.currentPrice) {
          return socket.emit("bidError", "Bid too low");
        }

        auction.currentPrice = bidAmount;
        auction.bidCount = (auction.bidCount || 0) + 1;

        await auction.save();

        io.to(auctionId).emit("bidUpdated", {
          auctionId,
          currentPrice: auction.currentPrice,
          bidCount: auction.bidCount,
          latestBid: { userId, amount: bidAmount }
        });

      } catch (err) {
        console.error(err);
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected:", socket.id);
    });
  });
};

module.exports = { initSocket };