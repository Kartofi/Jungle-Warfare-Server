const Basic = require("../Basic");
const lobbyManager = require("../lobbyManager");

async function Reload(json, broadcastFunction) {
  let time = new Date().getTime();
  let lobby = lobbyManager.checkIfSessionIsIn(json.sessionId);
  if (lobby == null) {
    return;
  }
  let playerInstance = lobbies[lobby].players.find(
    (element) =>
      element.name == json.name &&
      element.deviceId == json.deviceId &&
      element.sessionId == json.sessionId
  );
  let weaponData = await lobbyManager.getWeaponData(
    playerInstance.weapon,
    lobby
  );
  if (playerInstance == null || weaponData == null) {
    return;
  }
  if (
    playerInstance.bullets < weaponData.bulletsMax &&
    time - playerInstance.lastReload > weaponData.reloadTime * 1000
  ) {
    playerInstance.reloading = true;
    broadcastFunction(
      JSON.stringify({ type: "reload", from: playerInstance.name }),
      lobby,
      null
    );
    await Basic.Wait(weaponData.reloadTime * 1000);
    playerInstance.bullets = weaponData.bulletsMax;
    playerInstance.reloading = false;
  }
}
module.exports = { Reload };
