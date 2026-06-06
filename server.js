const mongoose = require("mongoose");
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

// =======================
// DATABASE
// =======================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB error:", err));

// =======================
// SCHEMA
// =======================
const BidSchema = new mongoose.Schema({
  carId: String,
  price: Number,
  user: String,
  time: { type: Date, default: Date.now }
});

const Bid = mongoose.model("Bid", BidSchema);

// =======================
// APP SETUP
// =======================
const app = express();

app.use(cors({
  origin: "https://bidup.co.zw"
}));

app.use(express.json());

// =======================
// HTTP SERVER
// =======================
const server = http.createServer(app);

// =======================
// SOCKET.IO SETUP
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
// SOCKET LOGIC
// =======================
io.on("connection", async (socket) => {
  console.log("User connected:", socket.id);

  // Send last 50 bids on connect
  try {
    const history = await Bid.find()
      .sort({ time: -1 })
      .limit(50);

    socket.emit("bidHistory", history);
  } catch (err) {
    console.log("History error:", err);
  }

  // PLACE BID
  socket.on("placeBid", async (data) => {
    try {
      console.log("Bid received:", data);

      const bid = new Bid(data);
      await bid.save();

      // broadcast update to all users
      io.emit("bidUpdate", data);

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