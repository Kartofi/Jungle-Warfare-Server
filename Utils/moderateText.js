let fs = require("fs");
var filter = require("leo-profanity");

/*
const wash = require('washyourmouthoutwithsoap');

let data = [];
wash.supported().forEach((element)=>{
    data = data.concat(wash.words(element));
})

let custom = fs.readFileSync("./Settings/customBadWords.json")
custom = JSON.parse(custom);
data = data.concat(custom);
fs.writeFileSync("./Settings/badwords.json",JSON.stringify(data))
*/
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
