require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

// =====================
// DB
// =====================
const connectDB = require("./config/db");
connectDB();

// =====================
// APP
// =====================
const app = express();
app.use(express.json());

// =====================
// CORS
// =====================
app.use(
  cors({
    origin: "https://bidup.co.zw",
    credentials: true
  })
);

// =====================
// ROUTES (IMPORT SAFELY)
// =====================
const authRoutes = require("./routes/authRoutes");
const auctionRoutes = require("./routes/auctionRoutes");
const sellerRoutes = require("./routes/sellerRoutes");
const adminRoutes = require("./routes/adminRoutes");

// =====================
// HEALTH CHECKS (IMPORTANT FOR RENDER)
// =====================
app.get("/", (req, res) => {
  res.send("🚗 BidUp API Running");
});

app.get("/test", (req, res) => {
  res.json({ ok: true, message: "API working" });
});

// =====================
// CREATE HTTP SERVER
// =====================
const server = http.createServer(app);

// =====================
// SOCKET.IO (ONLY ONCE)
// =====================
const io = new Server(server, {
  cors: {
    origin: "https://bidup.co.zw",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// =====================
// SOCKET INIT MODULE
// =====================
require("./config/socket").initSocket(io);

// =====================
// MAKE IO AVAILABLE TO ROUTES
// =====================
app.use((req, res, next) => {
  req.io = io;
  next();
});

// =====================
// ROUTES MOUNTING (AFTER MIDDLEWARE IS SAFE)
// =====================
app.use("/api/auth", authRoutes);
app.use("/api/auctions", auctionRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/admin", adminRoutes);

// =====================
// AUCTION AUTO CLOSE JOB
// =====================
const { startAuctionClosingJob } = require("./jobs/closeAuctions");
startAuctionClosingJob(io);

// =====================
// START SERVER
// =====================
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 BidUp API running on port ${PORT}`);
});