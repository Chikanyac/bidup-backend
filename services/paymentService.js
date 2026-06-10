async function chargeSellerFee(userId, amount) {
  // placeholder for PayNow / Stripe / Flutterwave integration
  console.log(`Charging seller ${userId} fee: $${amount}`);
  return true;
}

async function releaseFundsToSeller(auction) {
  // future escrow logic
  console.log("Releasing funds for auction:", auction.carId);
  return true;
}

module.exports = {
  chargeSellerFee,
  releaseFundsToSeller
};