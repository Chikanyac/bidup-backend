const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH
);

async function sendBidAlert(phone, auction, bid) {
  return client.messages.create({
    from: "whatsapp:+14155238886",
    to: `whatsapp:${phone}`,
    body: `🔥 New Bid on ${auction.title}\nBid: $${bid.price}\nUser: ${bid.user}`
  });
}

module.exports = { sendBidAlert };