require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

console.log("🚀 SERVER STARTING...");
console.log("PORT:", process.env.PORT);

// =====================
// DB
// =====================
const connectDB = require("./config/db");
connectDB();

// =====================
// APP
// =====================
const app = express();

// IMPORTANT: raw body + cors order fixed
app.use(cors({
  origin: ["https://bidup.co.zw", "http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

app.use(express.json());

// =====================
// ROUTES
// =====================
const authRoutes = require("./routes/authRoutes");
const auctionRoutes = require("./routes/auctionRoutes");
const sellerRoutes = require("./routes/sellerRoutes");
const adminRoutes = require("./routes/adminRoutes");

// =====================
// HEALTH
// =====================
app.get("/", (req, res) => {
  res.send("🚗 BidUp API Running");
});

app.get("/test", (req, res) => {
  res.json({ ok: true });
});

// =====================
// HTTP SERVER
// =====================
const server = http.createServer(app);

// =====================
// SOCKET IO (FIXED FOR RENDER)
// =====================
const io = new Server(server, {
  cors: {
    origin: ["https://bidup.co.zw", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["websocket", "polling"]
});

// socket init (safe)
require("./config/socket").initSocket(io);

// debug connection
io.on("connection", (socket) => {
  console.log("🔌 SOCKET CONNECTED:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ SOCKET DISCONNECTED:", socket.id);
  });
});

// make io available
app.use((req, res, next) => {
  req.io = io;
  next();
});

// =====================
// ROUTES MOUNT
// =====================
app.use("/api/auth", authRoutes);
app.use("/api/auctions", auctionRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/admin", adminRoutes);

// =====================
// START
// =====================
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 BidUp API running on port ${PORT}`);
});