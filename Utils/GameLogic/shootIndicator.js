const Basic = require("../Basic");
const lobbyManager = require("../lobbyManager");
const AntiCheat = require("../AntiCheat");

async function Handle(json, info, broadcastFunction) {
  let time = new Date().getTime();
  let match = lobbyManager.checkIfSessionIsIn(json.sessionId);
  if (match == null) {
    return;
  }
  let shooterInstance = lobbies[match].players.find(
    (element) =>
      element.id == json.playerId &&
      element.deviceId == json.deviceId &&
      element.sessionId == json.sessionId
  );
  if (shooterInstance == null || shooterInstance.weapon == null) {
    return;
  }
  let weaponData = lobbyManager.getWeaponData(shooterInstance.weapon, match);
  if (
    !weaponData ||
    !shooterInstance ||
    !AntiCheat.ShootIndicator(
      shooterInstance,
      weaponData,
      json.hit,
      time,
      info.address
    )
  ) {
    return;
  }
  broadcastFunction(
    JSON.stringify({
      type: "shootIndicator",
      fromId: json.playerId,
      hit: json.hit,
      hitColor: json.hitColor,
      playerHit: json.playerHit,
      emissionIntensity: json.emissionIntensity,
    }),
    shooterInstance.lobbyId
  );
}
module.exports = { Handle };
