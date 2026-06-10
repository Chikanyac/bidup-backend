require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const connectDB = require("./config/db");

// =====================
// INIT DB
// =====================
connectDB();

// =====================
// APP
// =====================
const app = express();

// IMPORTANT: JSON + URL ENCODED (fixes register/login issues)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================
// FIXED CORS (VERY IMPORTANT)
// =====================
app.use(
  cors({
    origin: [
      "https://bidup.co.zw",
      "https://www.bidup.co.zw",
      "http://localhost:3000"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
  })
);

// HANDLE PRE-FLIGHT REQUESTS (FIX CORS ERROR)
app.options("*", cors());

// =====================
// ROUTES
// =====================
const authRoutes = require("./routes/authRoutes");
const auctionRoutes = require("./routes/auctionRoutes");
const sellerRoutes = require("./routes/sellerRoutes");
const adminRoutes = require("./routes/adminRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/auctions", auctionRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/admin", adminRoutes);

// =====================
// HEALTH CHECK
// =====================
app.get("/", (req, res) => {
  res.send("🚗 BidUp API Running");
});

app.get("/test", (req, res) => {
  res.json({ ok: true, message: "API working" });
});

// =====================
// HTTP SERVER
// =====================
const server = http.createServer(app);

// =====================
// SOCKET.IO (FIXED FOR RENDER)
// =====================
const io = new Server(server, {
  cors: {
    origin: [
      "https://bidup.co.zw",
      "https://www.bidup.co.zw",
      "http://localhost:3000"
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["websocket", "polling"]
});

// =====================
// SOCKET INIT
// =====================
require("./config/socket").initSocket(io);

// Debug
io.on("connection", (socket) => {
  console.log("🔌 SOCKET CONNECTED:", socket.id);

  socket.on("pingTest", () => {
    socket.emit("pongTest", "alive");
  });
});

// =====================
// GLOBAL IO
// =====================
app.use((req, res, next) => {
  req.io = io;
  next();
});

// =====================
// AUCTION JOB
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