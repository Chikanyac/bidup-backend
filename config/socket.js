let ioInstance = null;

const initSocket = (io) => {
  ioInstance = io;

  io.on("connection", (socket) => {
    console.log("🔌 Connected:", socket.id);

    // JOIN AUCTION ROOM
    socket.on("joinAuction", (auctionId) => {
      socket.join(auctionId);
      console.log(`Joined auction: ${auctionId}`);
    });

    // PLACE BID (MAIN LOGIC ENTRY)
    socket.on("placeBid", async (data) => {
      try {
        const { auctionId, bidAmount, userId } = data;

        if (!auctionId || !bidAmount) {
          return socket.emit("bidError", "Invalid bid data");
        }

        // 👉 emit to ALL clients in auction room
        io.to(auctionId).emit("bidUpdated", {
          auctionId,
          currentPrice: bidAmount,
          bidCount: 1, // replace with DB later
          latestBid: {
            userId,
            amount: bidAmount
          }
        });

        console.log("💰 Bid placed:", data);

      } catch (err) {
        console.error(err);
        socket.emit("bidError", "Server error placing bid");
      }
    });

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