let Vectors = require("./Vectors");

function PositionChange(server, player, json, time, info) {
  if (json.position == null || player.position == null) {
    return false;
  }
  let fasterPacketSend = player.lastUpdate - time > 0;
  let imitateOtherPlayer =
    player.ip != info.address || player.sessionId != json.sessionId;
  let moveWhileDead = player.isDead == true || player.isDead == undefined;
  let distance = Vectors.subVectors(
    Vectors.Vector3.fromJSON(json.position),
    Vectors.Vector3.fromJSON(player.position)
  ).magnitude;
  let moveFaster = distance > rules.moveMaxDistance;
  return (
    !fasterPacketSend && !imitateOtherPlayer && !moveWhileDead && !moveFaster
  );
}
function ShootIndicator(player,weaponData, hit, time, ip) {
  let distance = Vectors.subVectors(
    Vectors.Vector3.fromJSON(hit),
    Vectors.Vector3.fromJSON(player.position)
  ).magnitude;
  let imitateOtherPlayer = player.ip != ip;
  let shootWhileDead = player.isDead == true || player.isDead == undefined;
  let maxDistance = distance > weaponData.shootIndicatorDistance * 1.5;
  let fastShoot = time - player.lastShoot < rules.shootTime;
  let reloading = player.reloading;
  return (
    !imitateOtherPlayer &&
    !shootWhileDead &&
    !maxDistance &&
    !fastShoot &&
    !reloading
  );
}
module.exports = { PositionChange, ShootIndicator };
