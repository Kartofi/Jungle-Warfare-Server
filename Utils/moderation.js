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

let apiKey = "2056fb945ee93cf88f0977696e5c7bfb";
const axios = require("axios");

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
function ModeratePFP(imageBuffer) {
  const config = {
    method: "post",
    url: `https://api.moderatecontent.com/moderate/`,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: {
      key: apiKey,
      base64: "true",
      url: image,
    },
  };

  axios(config)
    .then(function (response) {
      console.log(response);
    })
    .catch(function (error) {
      console.log(error);
    });
  return "data:image/jpeg;base64," + imageBuffer;
}
module.exports = { CensorBadWords, HaveBadWords, ModeratePFP };
