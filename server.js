const mongoose = require("mongoose");
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

// =======================
// APP SETUP
// =======================
const app = express();

app.use(cors({
  origin: "https://bidup.co.zw"
}));

app.use(express.json());

// =======================
// DATABASE
// =======================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB error:", err));

// =======================
// SCHEMAS
// =======================
const AuctionSchema = new mongoose.Schema({
  carId: { type: String, unique: true },
  title: String,
  startingPrice: Number,
  currentPrice: Number,
  image: String,
  createdAt: { type: Date, default: Date.now }
});

const Auction = mongoose.model("Auction", AuctionSchema);

const BidSchema = new mongoose.Schema({
  carId: String,
  price: Number,
  user: String,
  time: { type: Date, default: Date.now }
});

const Bid = mongoose.model("Bid", BidSchema);

// =======================
// HTTP SERVER
// =======================
const server = http.createServer(app);

// =======================
// SOCKET.IO
// =======================
const io = new Server(server, {
  cors: {
    origin: "https://bidup.co.zw",
    methods: ["GET", "POST"]
  }
});

// =======================
// TEST ROUTE
// =======================
app.get("/", (req, res) => {
  res.send("BidUp Auction Backend Running 🚗⚡");
});

// =======================
// CREATE AUCTION (SELL VEHICLE)
// =======================
app.post("/create-auction", async (req, res) => {
  try {
    const { carId, title, startingPrice, image } = req.body;

    const auction = new Auction({
      carId,
      title,
      startingPrice,
      currentPrice: startingPrice,
      image
    });

    await auction.save();

    io.emit("newAuction", auction);

    res.json({ success: true, auction });

  } catch (err) {
    console.log("Create auction error:", err);
    res.status(500).json({ error: "Failed to create auction" });
  }
});

// =======================
// SOCKET CONNECTION
// =======================
io.on("connection", async (socket) => {
  console.log("User connected:", socket.id);

  try {
    const auctions = await Auction.find();
    socket.emit("initAuctions", auctions);
  } catch (err) {
    console.log("Auction load error:", err);
  }

  try {
    const history = await Bid.find()
      .sort({ time: -1 })
      .limit(50);

    socket.emit("bidHistory", history);
  } catch (err) {
    console.log("History error:", err);
  }

  // =======================
  // PLACE BID
  // =======================
  socket.on("placeBid", async (data) => {
    try {
      const { carId, amount, user } = data;

      const auction = await Auction.findOne({ carId });
      if (!auction) return;

      if (amount <= auction.currentPrice) return;

      auction.currentPrice = amount;
      await auction.save();

      const bid = new Bid({
        carId,
        price: amount,
        user
      });

      await bid.save();

      io.emit("bidUpdate", {
        carId,
        amount,
        user
      });

    } catch (err) {
      console.log("Bid error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// =======================
// START SERVER
// =======================
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});