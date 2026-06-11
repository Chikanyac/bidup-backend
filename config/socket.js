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
      console.log(`📦 Joined auction room: ${auctionId}`);
    });

    // =====================
    // GET LIVE AUCTIONS
    // =====================
    socket.on("getLiveAuctions", async () => {
      try {
        const auctions = await Auction.find({ status: "live" });

        socket.emit("initAuctions", auctions);
      } catch (err) {
        console.error("❌ Auction fetch error:", err);
        socket.emit("bidError", "Failed to load auctions");
      }
    });

    // =====================
    // PLACE BID
    // =====================
    socket.on("placeBid", async (data) => {
      try {
        const { auctionId, bidAmount, userId } = data;

        if (!auctionId || !bidAmount) {
          return socket.emit("bidError", "Invalid bid data");
        }

        const auction = await Auction.findById(auctionId);

        if (!auction) {
          return socket.emit("bidError", "Auction not found");
        }

        if (auction.status !== "live") {
          return socket.emit("bidError", "Auction not active");
        }

        if (bidAmount <= auction.currentPrice) {
          return socket.emit("bidError", "Bid must be higher");
        }

        // update auction
        auction.currentPrice = bidAmount;
        auction.bidCount = (auction.bidCount || 0) + 1;

        await auction.save();

        // broadcast to room
        io.to(auctionId).emit("bidUpdated", {
          auctionId,
          currentPrice: auction.currentPrice,
          bidCount: auction.bidCount,
          latestBid: {
            userId,
            amount: bidAmount
          }
        });

        console.log("💰 Bid placed:", { auctionId, bidAmount });

      } catch (err) {
        console.error("❌ BID ERROR:", err);
        socket.emit("bidError", "Server error placing bid");
      }
    });

    // =====================
    // DISCONNECT
    // =====================
    socket.on("disconnect", () => {
      console.log("❌ Disconnected:", socket.id);
    });
  });
};

module.exports = { initSocket };