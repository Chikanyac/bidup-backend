const router = require("express").Router();

const {
  createAuction,
  getAuctions
} = require("../controllers/auctionController");

router.get("/", getAuctions);
router.post("/create", createAuction);

module.exports = router;