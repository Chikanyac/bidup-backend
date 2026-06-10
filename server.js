require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

console.log("🔥 SERVER STARTING - AUTH ROUTES SHOULD LOAD");

// =======================
// DATABASE
// =======================
const connectDB = require("./config/db");
connectDB();

// =======================
// ROUTES
// =======================
const authRoutes = require("./routes/authRoutes");
const auctionRoutes = require("./routes/auctionRoutes");
const sellerRoutes = require("./routes/sellerRoutes");
const adminRoutes = require("./routes/adminRoutes");

console.log("📦 AuthRoutes loaded:", !!authRoutes);

// =======================
// APP INIT
// =======================
const app = express();
app.use(express.json());

// =======================
// CORS
// =======================
app.use(
  cors({
    origin: "https://bidup.co.zw",
    credentials: true
  })
);

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
    methods: ["GET", "POST"],
    credentials: true
  }
});

// =======================
// MAKE IO AVAILABLE TO APP
// =======================
app.set("io", io);

// middleware so controllers can use req.io
app.use((req, res, next) => {
  req.io = io;
  next();
});

// =======================
// SOCKET INIT MODULE
// =======================
require("./config/socket").initSocket(io);

// =======================
// ROUTES (AFTER IO MIDDLEWARE)
// =======================
app.use("/api/auth", authRoutes);
app.use("/api/auctions", auctionRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/admin", adminRoutes);

app._router.stack.forEach((r) => {
  if (r.route) {
    console.log("ROUTE:", r.route.path);
  }
});

// =======================
// HEALTH CHECK
// =======================
app.get("/", (req, res) => {
  res.send("🚗 BidUp V5 Marketplace API Running");
});

// TEST ROUTE (TEMP DEBUG)
app.get("/test", (req, res) => {
  res.json({ ok: true, message: "API working" });
});

// =======================
// AUCTION AUTO CLOSE JOB
// =======================
const { startAuctionClosingJob } = require("./jobs/closeAuctions");
startAuctionClosingJob(io);

// =======================
// START SERVER
// =======================
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 BidUp V5 running on port ${PORT}`);
});