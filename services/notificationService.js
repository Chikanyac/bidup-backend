function notifyNewAuction(io, auction) {
  io.emit("newAuction", auction);
}

function notifyBidUpdate(io, payload) {
  io.emit("bidUpdate", payload);
}

function notifyAuctionClosed(io, payload) {
  io.emit("auctionClosed", payload);
}

module.exports = {
  notifyNewAuction,
  notifyBidUpdate,
  notifyAuctionClosed
};