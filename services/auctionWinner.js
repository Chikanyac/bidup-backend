const Auction = require("../models/Auction");
const Bid = require("../models/Bid");

async function finalizeAuctionWinner(auctionId, io) {
  try {
    const auction = await Auction.findById(auctionId);

    if (!auction) return;

    if (auction.status === "closed") return;

    // =======================
    // FIND HIGHEST BID
    // =======================
    const highestBid = await Bid.findOne({ auction: auctionId })
      .sort({ amount: -1 })
      .populate("user", "name email");

    // =======================
    // NO BIDS CASE
    // =======================
    if (!highestBid) {
      auction.status = "closed";
      auction.winner = null;
      await auction.save();

      io.emit("auctionEnded", {
        auctionId,
        winner: null,
        message: "No bids placed"
      });

      return auction;
    }

    // =======================
    // SET WINNER
    // =======================
    auction.status = "closed";
    auction.winner = {
      user: highestBid.user._id,
      amount: highestBid.amount
    };

    await auction.save();

    // mark winning bid
    await Bid.updateMany(
      { auction: auctionId },
      { isWinning: false }
    );

    highestBid.isWinning = true;
    await highestBid.save();

    // =======================
    // BROADCAST RESULT
    // =======================
    io.emit("auctionEnded", {
      auctionId,
      winner: {
        user: highestBid.user,
        amount: highestBid.amount
      }
    });

    console.log(`🏁 Auction closed: ${auctionId}`);

    return auction;

  } catch (err) {
    console.error("Winner finalization error:", err);
  }
}

module.exports = { finalizeAuctionWinner };