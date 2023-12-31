const Basic = require("../Basic");
const Vectors = require("../Vectors");
const lobbyManager = require("../lobbyManager");

async function Shoot(json, broadcastFunction) {
  let time = new Date().getTime();
  try {
    let match = lobbyManager.checkIfSessionIsIn(json.sessionId);
    if (match == null) {
      return;
    }
    let lobbyInstance = lobbies[match];
    let shooterInstance = lobbyInstance.players.find(
      (element) =>
        element.id == json.playerId &&
        element.deviceId == json.deviceId &&
        element.sessionId == json.sessionId
    );
    let weaponData = lobbyManager.getWeaponData(shooterInstance.weapon, match);
    let targetInstance = lobbyInstance.players.find(
      (element) => element.name == json.secondName
    );
    if (
      shooterInstance == null ||
      targetInstance == null ||
      shooterInstance.isDead == true ||
      targetInstance.isDead == true ||
      weaponData == null
    ) {
      return;
    }

    let distance = Vectors.subVectors(
      Vectors.Vector3.fromJSON(targetInstance.position),
      Vectors.Vector3.fromJSON(shooterInstance.position)
    ).magnitude;
    if (
      distance <= weaponData.shootMaxDistance &&
      time - shooterInstance.lastShoot > weaponData.shootCooldown * 1000 &&
      shooterInstance.bullets > 0 &&
      shooterInstance.reloading == false
    ) {
      targetInstance.health -= json.headShot
        ? weaponData.damage * weaponData.headShotMultiplier
        : weaponData.damage;
      // take health

      if (targetInstance.health <= 0) {
        targetInstance.health = 0;
        shooterInstance.kills++; // add kills
        targetInstance.isDead = true;
        broadcastFunction(
          JSON.stringify({
            type: "kill",
            from: shooterInstance.name,
            to: targetInstance.name,
            fromId: shooterInstance.id,
            toId: targetInstance.id,
            hit: json.positionHit,
          }),
          shooterInstance.lobbyId,
          null
        );
        await Basic.Wait(lobbyInstance.rules.respawnTime);
        let newWeapon = lobbyManager.randomWeapon(match);
        targetInstance.isDead = false;
        targetInstance.weapon = newWeapon.WeaponName;
        targetInstance.health = lobbyInstance.rules.maxHealth;
        targetInstance.bullets = newWeapon.bulletsMax;
        targetInstance.position = rules.spawnPos.JsonObj;
      }
      shooterInstance.lastShoot = time;
    }
  } catch (error) {
    console.log(error);
  }
}
module.exports = { Shoot };
