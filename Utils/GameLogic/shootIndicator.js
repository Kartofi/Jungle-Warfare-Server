const Basic = require("../General/Basic");
const lobbyManager = require("../GameManager/lobbyManager");
const AntiCheat = require("../GameManager/AntiCheat");
const validateJsonInput = require("../General/validateJsonInput");

async function Handle(json, info, broadcastFunction) {
  let validJson = validateJsonInput.ValidateShootIndicator(json);
  if (validJson == false) {
    return;
  }
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
