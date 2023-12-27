const Basic = require("../Basic");
const lobbyManager = require("../lobbyManager");

async function Disconnect(json, info, broadcastFunction) {
  let playerInstance = lobbyManager.getPlayerUsingName(json.name);
  if (playerInstance == null) {
    return;
  }
  if (
    playerInstance.name == json.name &&
    playerInstance.deviceId == json.deviceId &&
    playerInstance.ip == info.address &&
    playerInstance.sessionId == json.sessionId
  ) {
    console.log("Player: " + json.name + " left!");
    broadcastFunction(
      JSON.stringify({
        type: "sendMessage",
        from: "Server",
        request: json.name + " left the lobby.",
      }),
      playerInstance.lobbyId,
      null
    );
    if (lobbies[playerInstance.lobbyId].players.length <= 0) {
      delete lobbies[playerInstance.lobbyId];
      console.log("Removed lobby: " + playerInstance.lobbyId);
    }
    lobbyManager.RemovePlayerUsingName(json.name);
  }
}
module.exports = { Disconnect };
