var Filter = require('bad-words');

var customFilter = new Filter({ placeHolder: '#'});

const wash = require('washyourmouthoutwithsoap');
//customFilter.addWords(...wash.words('bg'));

function CensorBadWords(message){
    if (!HaveBadWords(message)){
        return message;
    }

    return "no";
}
function HaveBadWords(message){
    let bg = wash.check('bg',message);
    let en = wash.check('en',message);

   return bg || en;
}
module.exports = {CensorBadWords, HaveBadWords}