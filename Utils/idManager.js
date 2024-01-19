const crypto = require("crypto");

function generateRandomStringId(size = 64) {
  var token = crypto.randomBytes(Number(size)).toString("hex");
  return token;
}
function generateRandomNumberId(size = 20) {
  const bytesNeeded = Math.ceil((size * 4) / 3); // Adjusting for base64 encoding
  const uniqueHexId = crypto.randomBytes(bytesNeeded).toString("hex");

  // Convert the hexadecimal string to a decimal (base 10) number
  const uniqueNumberId = BigInt(`0x${uniqueHexId}`).toString();

  return uniqueNumberId.slice(0, size);
}
module.exports = {
  generateRandomStringId,
  generateRandomNumberId,
};
