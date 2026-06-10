/**
 * Basic email validation
 */
function isValidEmail(email) {
  return typeof email === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Password strength check (simple but effective baseline)
 */
function isStrongPassword(password) {
  return typeof password === "string" &&
    password.length >= 6;
}

/**
 * Auction validation
 */
function validateAuction(data) {
  const errors = [];

  if (!data.carId) errors.push("carId is required");
  if (!data.title) errors.push("title is required");

  if (!data.startingPrice || isNaN(data.startingPrice)) {
    errors.push("valid startingPrice required");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Bid validation
 */
function validateBid(data) {
  const errors = [];

  if (!data.carId) errors.push("carId is required");
  if (!data.amount || isNaN(data.amount)) {
    errors.push("valid bid amount required");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  isValidEmail,
  isStrongPassword,
  validateAuction,
  validateBid
};