let ioInstance = null;
const Auction = require("../models/Auction");

const initSocket = (io) => {
  ioInstance = io;

  io.on("connection", async (socket) => {
    console.log("🔌 Connected:", socket.id);

    // =====================
    // SEND LIVE AUCTIONS ON CONNECT
    // =====================
    try {
      const auctions = await Auction.find({ status: "live" });
      socket.emit("initAuctions", auctions);
    } catch (err) {
      console.error("❌ Failed to load auctions:", err);
    }

    // =====================
    // GET LIVE AUCTIONS MANUALLY
    // =====================
    socket.on("getLiveAuctions", async () => {
      const auctions = await Auction.find({ status: "live" });
      socket.emit("initAuctions", auctions);
    });

    // =====================
    // JOIN AUCTION ROOM
    // =====================
    socket.on("joinAuction", (auctionId) => {
      if (!auctionId) return;
      socket.join(auctionId);
      console.log(`📦 Joined auction room: ${auctionId}`);
    });

    // =====================
    // PLACE BID
    // =====================
    socket.on("placeBid", async (data) => {
      try {
        const { auctionId, bidAmount, userId } = data;

        if (!auctionId || !bidAmount || !userId) {
          return socket.emit("bidError", "Missing bid data");
        }

        const auction = await Auction.findById(auctionId);

        if (!auction) return socket.emit("bidError", "Auction not found");

        if (auction.status !== "live") {
          return socket.emit("bidError", "Auction not active");
        }

        if (bidAmount <= auction.currentPrice) {
          return socket.emit("bidError", "Bid must be higher");
        }

        auction.currentPrice = bidAmount;
        auction.bidCount = (auction.bidCount || 0) + 1;

        await auction.save();

        io.to(auctionId).emit("bidUpdated", {
          auctionId,
          currentPrice: auction.currentPrice,
          bidCount: auction.bidCount,
          latestBid: {
            userId,
            amount: bidAmount
          }
        });

        console.log("💰 BID:", { auctionId, bidAmount, userId });

      } catch (err) {
        console.error("❌ BID ERROR:", err);
        socket.emit("bidError", "Server error");
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

const getIO = () => {
  if (!ioInstance) throw new Error("Socket not initialized");
  return ioInstance;
};

module.exports = {
  initSocket,
  getIO
};