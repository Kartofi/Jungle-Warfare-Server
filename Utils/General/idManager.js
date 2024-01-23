const crypto = require("crypto");

function generateRandomStringId(size = 64) {
  var token = crypto.randomBytes(Number(size)).toString("hex");
  return token;
}
function generateRandomNumberId(size = 18) {
  const bytesNeeded = Math.ceil((size * 4) / 3);
  const uniqueHexId = crypto.randomBytes(bytesNeeded).toString("hex");
  const uniqueNumberId = BigInt(`0x${uniqueHexId}`).toString();

  return uniqueNumberId.slice(0, size);
}
module.exports = {
  generateRandomStringId,
  generateRandomNumberId,
};
