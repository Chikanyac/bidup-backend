const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");
const { createAuction } = require("../controllers/auctionController");
console.log("createAuction =", createAuction);

const sellerAuth = require("../middleware/sellerAuth");

// IMPORTANT: multer must come BEFORE controller
router.post(
  "/create",
  sellerAuth,
  upload.single("image"),
  createAuction
);

module.exports = router;