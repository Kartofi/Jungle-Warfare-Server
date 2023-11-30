async function Wait(time){
    await new Promise((resolve) => setTimeout(resolve, time)); // Wait
}
module.exports = {Wait}