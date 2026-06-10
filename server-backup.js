require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

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
// USER MODEL
// =======================
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String
});

const User = mongoose.model("User", UserSchema);

// =======================
// AUCTION MODEL
// =======================
const AuctionSchema = new mongoose.Schema({
  carId: { type: String, unique: true, required: true },
  title: { type: String, required: true },
  startingPrice: { type: Number, required: true },
  currentPrice: { type: Number, required: true },
  image: String,

  status: { type: String, default: "live" },
  endsAt: { type: Date, default: () => Date.now() + 1000 * 60 * 30 },

  winner: {
    user: String,
    amount: Number
  },

  createdAt: { type: Date, default: Date.now }
});

const Auction = mongoose.model("Auction", AuctionSchema);

// =======================
// BID MODEL
// =======================
const BidSchema = new mongoose.Schema({
  carId: String,
  price: Number,
  user: String,
  userId: String,
  time: { type: Date, default: Date.now }
});

const Bid = mongoose.model("Bid", BidSchema);

// =======================
// SERVER
// =======================
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://bidup.co.zw",
    methods: ["GET", "POST"]
  }
});

// =======================
// JWT HELPERS
// =======================
function generateToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

// =======================
// AUTH ROUTES
// =======================

// REGISTER
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({ name, email, password: hashed });
    await user.save();

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: "Register failed" });
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid password" });

    const token = generateToken(user);

    res.json({
      token,
      user: {
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

// =======================
// CREATE AUCTION
// =======================
app.post("/create-auction", async (req, res) => {
  try {
    const { carId, title, startingPrice, image } = req.body;

    const auction = new Auction({
      carId,
      title,
      startingPrice,
      currentPrice: startingPrice,
      image,
      status: "live",
      endsAt: Date.now() + 1000 * 60 * 30
    });

    await auction.save();

    io.emit("newAuction", auction);

    res.json({ success: true, auction });

  } catch (err) {
    res.status(500).json({ error: "Create auction failed" });
  }
});

// =======================
// SOCKET CONNECTION
// =======================
io.on("connection", async (socket) => {

  const auctions = await Auction.find({ status: "live" });
  socket.emit("initAuctions", auctions);

  const history = await Bid.find().sort({ time: -1 }).limit(50);
  socket.emit("bidHistory", history);

  // =======================
  // PLACE BID (FULL JWT PROTECTION)
  // =======================
  socket.on("placeBid", async (data) => {

    try {
      const { carId, amount, token } = data;

      // 1. VERIFY TOKEN
      const decoded = verifyToken(token);
      if (!decoded) {
        socket.emit("bidError", "Unauthorized user");
        return;
      }

      // 2. FIND USER
      const user = await User.findById(decoded.id);
      if (!user) {
        socket.emit("bidError", "User not found");
        return;
      }

      // 3. FIND AUCTION
      const auction = await Auction.findOne({ carId });

      if (!auction || auction.status !== "live") {
        socket.emit("bidError", "Auction closed");
        return;
      }

      // 4. VALIDATE BID
      if (amount <= auction.currentPrice) {
        socket.emit("bidError", "Bid too low");
        return;
      }

      // 5. UPDATE AUCTION
      auction.currentPrice = amount;
      await auction.save();

      // 6. SAVE BID
      const bid = new Bid({
        carId,
        price: amount,
        user: user.name,
        userId: user._id
      });

      await bid.save();

      // 7. BROADCAST UPDATE
      io.emit("bidUpdate", {
        carId,
        price: amount,
        user: user.name
      });

    } catch (err) {
      console.log("Bid error:", err);
    }
  });

  socket.on("disconnect", () => {});
});

// =======================
// AUCTION CLOSING ENGINE (WINNER SELECTION)
// =======================
setInterval(async () => {
  try {
    const now = new Date();

    const expired = await Auction.find({
      status: "live",
      endsAt: { $lte: now }
    });

    for (const auction of expired) {

      const topBid = await Bid.findOne({ carId: auction.carId })
        .sort({ price: -1 });

      auction.status = "closed";

      if (topBid) {
        auction.winner = {
          user: topBid.user,
          amount: topBid.price
        };
      }

      await auction.save();

      io.emit("auctionClosed", {
        carId: auction.carId,
        winner: auction.winner || null
      });
    }

  } catch (err) {
    console.log("Auction close error:", err);
  }
}, 15000);

// =======================
// START SERVER
// =======================
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});