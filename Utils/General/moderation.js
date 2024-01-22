let fs = require("fs");
var filter = require("leo-profanity");

let badwords = fs.readFileSync("./Settings/badwords.json");
badwords = JSON.parse(badwords);
filter.add(badwords);

function CensorBadWords(message) {
  return filter.clean(message);
}
function HaveBadWords(message) {
  if (CensorBadWords(message) != message) {
    return true;
  }
  return true;
}
module.exports = { CensorBadWords, HaveBadWords };
