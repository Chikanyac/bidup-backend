const mongoose = require("mongoose");
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");


const BidSchema = new mongoose.Schema({
  carId: String,
  price: Number,
  user: String,
  time: { type: Date, default: Date.now }
});

const Bid = mongoose.model("Bid", BidSchema);

const app = express();

// IMPORTANT: Express CORS (HTTP routes only)
app.use(cors({
  origin: "https://bidup.co.zw"
}));

const server = http.createServer(app);

// IMPORTANT: Socket.io CORS (THIS FIXES YOUR ERROR)
const io = new Server(server, {
  cors: {
    origin: "https://bidup.co.zw",
    methods: ["GET", "POST"]
  }
});

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("BidUp Auction Backend Running 🚗⚡");
});

// SOCKET LOGIC
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("placeBid", (data) => {
    console.log("Bid received:", data);

  socket.on("placeBid", async (data) => {
  const bid = new Bid(data);
  await bid.save();

  io.emit("bidUpdate", data);
});

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// IMPORTANT: USE PORT FROM RENDER
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));


socket.on("connection", async (socket) => {
  const history = await Bid.find().sort({ time: -1 }).limit(50);
  socket.emit("bidHistory", history);
});