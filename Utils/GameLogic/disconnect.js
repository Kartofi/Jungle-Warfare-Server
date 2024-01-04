const Basic = require("../Basic");
const lobbyManager = require("../lobbyManager");
const validateJsonInput = require("../validateJsonInput");

async function Disconnect(json, info, broadcastFunction) {
  let validJson = validateJsonInput.ValidateDisconnect(json);
  if (validJson == false) {
    return;
  }

  let playerInstance = lobbyManager.getPlayerUsingId(json.playerId);
  if (playerInstance == null) {
    return;
  }
  if (
    playerInstance.id == json.playerId &&
    playerInstance.deviceId == json.deviceId &&
    playerInstance.ip == info.address &&
    playerInstance.sessionId == json.sessionId
  ) {
    console.log("Player: " + playerInstance.name + " left!");
    broadcastFunction(
      JSON.stringify({
        type: "sendMessage",
        fromId: -1,
        request: playerInstance.name + " left the lobby.",
      }),
      playerInstance.lobbyId,
      null
    );
    lobbyManager.RemovePlayerUsingId(json.playerId);
    return true;
  }
}
module.exports = { Disconnect };
