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
// APP INIT
// =====================
const app = express();

// =====================
// CORS CONFIG
// =====================
const allowedOrigins = [
  "https://bidup.co.zw",
  "http://localhost:3000"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("CORS blocked"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// =====================
// 🔥 FIX: PRE-FLIGHT (NO app.options("*"))
// =====================
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

// =====================
// BODY PARSER
// =====================
app.use(express.json());

// =====================
// ROUTES
// =====================
const authRoutes = require("./routes/authRoutes");
const auctionRoutes = require("./routes/auctionRoutes");
const sellerRoutes = require("./routes/sellerRoutes");
const adminRoutes = require("./routes/adminRoutes");

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
// SOCKET.IO
// =====================
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["websocket", "polling"]
});

// =====================
// SOCKET INIT
// =====================
require("./config/socket").initSocket(io);

// debug socket
io.on("connection", (socket) => {
  console.log("🔌 SOCKET CONNECTED:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ SOCKET DISCONNECTED:", socket.id);
  });
});

// =====================
// MAKE IO AVAILABLE
// =====================
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