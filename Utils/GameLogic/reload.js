const Basic = require("../General/Basic");
const lobbyManager = require("../GameManager/lobbyManager");
const validateJsonInput = require("../General/validateJsonInput");

async function Reload(json, broadcastFunction) {
  let validJson = validateJsonInput.ValidateReload(json);
  if (validJson == false) {
    return;
  }

  let time = new Date().getTime();
  let lobby = lobbyManager.checkIfSessionIsIn(json.sessionId);
  if (lobby == null) {
    return;
  }
  let playerInstance = lobbies[lobby].players.find(
    (element) =>
      element.id == json.playerId &&
      element.deviceId == json.deviceId &&
      element.sessionId == json.sessionId
  );

  let weaponData = lobbyManager.getWeaponData(playerInstance.weapon, lobby);
  if (playerInstance == null || weaponData == null) {
    return;
  }
  if (
    playerInstance.bullets < weaponData.bulletsMax &&
    time - playerInstance.lastReload > weaponData.reloadTime * 1000
  ) {
    playerInstance.reloading = true;
    broadcastFunction(
      JSON.stringify({ type: "reload", fromId: playerInstance.id }),
      lobby,
      null
    );
    await Basic.Wait(weaponData.reloadTime * 1000);
    playerInstance.bullets = weaponData.bulletsMax;
    playerInstance.reloading = false;
  }
}
module.exports = { Reload };
