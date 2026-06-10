require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
connectDB();

const app = express();
const server = http.createServer(app);

/* =====================
   CORS (V2 SAFE)
===================== */
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

app.options("*", cors());
app.use(express.json());

/* =====================
   SOCKET.IO (V2 STABLE)
===================== */
const io = new Server(server, {
  cors: {
    origin: [
      "https://bidup.co.zw",
      "https://www.bidup.co.zw",
      "http://localhost:3000"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

require("./config/socket").initSocket(io);

/* =====================
   ROUTES
===================== */
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/auctions", require("./routes/auctionRoutes"));
app.use("/api/seller", require("./routes/sellerRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

/* =====================
   HEALTH CHECK
===================== */
app.get("/", (req, res) => {
  res.send("🚗 BidUp V2 Marketplace Running");
});

/* =====================
   START
===================== */
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 BidUp V2 running on port ${PORT}`);
});