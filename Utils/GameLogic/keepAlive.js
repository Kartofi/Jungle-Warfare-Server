const Basic = require("../General/Basic");
const lobbyManager = require("../GameManager/lobbyManager");
const gzipManager = require("../General/GZipManager");
const validateJsonInput = require("../General/validateJsonInput");

function sendData(json, server, info) {
  server.send(gzipManager.Compress(json), info.port, info.address);
}

async function Handle(json, info, server) {
  let validJson = validateJsonInput.ValidateKeepAlive(json);
  if (validJson == false) {
    return;
  }

  if (lobbyManager.checkIfSessionIsIn(json.sessionId) == false) {
    return;
  }
  let time = new Date().getTime();
  let player = lobbyManager.getPlayerUsingId(json.playerId);
  if (!player || time - player.lastUpdate < rules.updateDelay) {
    return;
  }
  player.lastUpdate = time;
  player.state = json.state;
  player.ping = Basic.Clamp(json.ping, 0, 999);
  const players = lobbies[player.lobbyId].players.map(
    ({ ip, deviceId, sessionId, lastUpdate, lastShoot, ...rest }) => rest
  );
  sendData(JSON.stringify({ players: players }), server, info);
}
module.exports = { Handle };
