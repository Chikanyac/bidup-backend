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
// APP INIT
// =====================
const app = express();

// =====================
// BODY PARSERS
// =====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================
// CORS CONFIG (PRODUCTION SAFE)
// =====================
const corsOptions = {
  origin: [
    "https://bidup.co.zw",
    "https://www.bidup.co.zw",
    "http://localhost:3000"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
};

app.use(cors(corsOptions));

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
// CREATE HTTP SERVER
// =====================
const server = http.createServer(app);

// =====================
// SOCKET.IO (RENDER SAFE)
// =====================
const io = new Server(server, {
  cors: corsOptions,
  transports: ["polling", "websocket"],
  allowEIO3: true
});

// =====================
// SOCKET INIT MODULE
// =====================
require("./config/socket").initSocket(io);

// Debug connections
io.on("connection", (socket) => {
  console.log("🔌 SOCKET CONNECTED:", socket.id);

  socket.on("pingTest", () => {
    socket.emit("pongTest", "alive");
  });
});

// =====================
// MAKE IO AVAILABLE IN ROUTES
// =====================
app.use((req, res, next) => {
  req.io = io;
  next();
});

// =====================
// AUCTION BACKGROUND JOB
// =====================
const { startAuctionClosingJob } = require("./jobs/closeAuctions");
startAuctionClosingJob(io);

// =====================
// GLOBAL ERROR HANDLER
// =====================
app.use((err, req, res, next) => {
  console.error("❌ SERVER ERROR:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// =====================
// START SERVER
// =====================
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 BidUp API running on port ${PORT}`);
});