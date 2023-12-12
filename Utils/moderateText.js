let fs = require("fs")


const wash = require('washyourmouthoutwithsoap');


let data = [];
wash.supported().forEach((element)=>{
    data = data.concat(wash.words(element));
})

let custom = fs.readFileSync("./Settings/customBadWords.json")
custom = JSON.parse(custom);
data = data.concat(custom);

function compareNumbers(a, b) {
    return a.length - b.length;
  }
data.sort(compareNumbers).reverse();
fs.writeFileSync("./Settings/badwords.json",JSON.stringify(data))


let words = fs.readFileSync("./Settings/badwords.json");
words = JSON.parse(words);

function CensorBadWords(message){
    words.forEach(element => {
        if (message.includes(element) == true){
            message = message.replaceAll(element,"#".repeat(element.length))
        }
    });
    return message;
}
function HaveBadWords(message){
   if (CensorBadWords(message) != message){
    return true;
   }
   return true;
}
console.log(CensorBadWords("оо как си брат дееба и педала идиот"))
module.exports = {CensorBadWords, HaveBadWords}