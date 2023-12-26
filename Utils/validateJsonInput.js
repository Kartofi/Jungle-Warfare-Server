

const predefinedKeys = {
    playerData: []
}



function containsEveryKeyInArray(json,keys){
    let jsonKeys = Object.keys(json);
    if (jsonKeys.length != keys.length){
        return false;
    }
}
module.exports = {
    containsEveryKeyInArray
}