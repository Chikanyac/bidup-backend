const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // later restrict to your domain
  },
});

// ----------------------
// AUCTION STATE (in-memory MVP)
// ----------------------
let auctions = {
  aqua: { price: 4200 },
  fit: { price: 5100 },
  cx5: { price: 8750 },
};

// ----------------------
// SOCKET CONNECTION
// ----------------------
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Send current auction state on join
  socket.emit("init", auctions);

  // ----------------------
  // HANDLE BIDS
  // ----------------------
  socket.on("placeBid", (data) => {
    const { carId, amount, user } = data;

    if (!auctions[carId]) return;

    // validate bid
    if (amount <= auctions[carId].price) return;

    auctions[carId].price = amount;

    // broadcast update to ALL users
    io.emit("bidUpdate", {
      carId,
      price: amount,
      user: user || "Anonymous",
    });

    console.log(`New bid on ${carId}: $${amount}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// ----------------------
// BASIC ROUTE
// ----------------------
app.get("/", (req, res) => {
  res.send("BidUp Auction Backend Running 🚗⚡");
});

// ----------------------
// START SERVER
// ----------------------
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});