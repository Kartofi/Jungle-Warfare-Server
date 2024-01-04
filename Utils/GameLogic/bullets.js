const Basic = require("../Basic");
const lobbyManager = require("../lobbyManager");
const validateJsonInput = require("../validateJsonInput");

async function Handle(json, info) {
  if (!json.sessionId || typeof(json.sessionId) != "string") {
    return;
  }
  if (!json.playerId || typeof(json.playerId) != "number") {
    return;
  }
  if (!json.deviceId || typeof(json.deviceId) != "string") {
    return;
  }

  let lobby = lobbyManager.checkIfSessionIsIn(json.sessionId);
  if (lobby == null) {
    return;
  }
  let shooterInstance = lobbies[lobby].players.find(
    (element) =>
      element.id == json.playerId &&
      element.deviceId == json.deviceId &&
      element.sessionId == json.sessionId &&
      element.ip == info.address
  );
  if (shooterInstance) {
    if (shooterInstance.bullets > 0 && shooterInstance.reloading == false) {
      shooterInstance.bullets--;
    }
  }
}
module.exports = { Handle };
