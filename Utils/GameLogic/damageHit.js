const Basic = require("../Basic");
const Vectors = require("../Vectors");
const lobbyManager = require("../lobbyManager");
const validateJsonInput = require("../validateJsonInput");

async function Handle(json, broadcastFunction) {
  let validJson = validateJsonInput.ValidateDamageHit(json);
  if (validJson == false) {
    return;
  }

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
      (element) => element.id == json.secondId
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
        shooterInstance.health = Basic.Clamp(
          shooterInstance.health + lobbyInstance.rules.maxHealth / 2,
          0,
          lobbyInstance.rules.maxHealth
        );
        targetInstance.isDead = true;
        broadcastFunction(
          JSON.stringify({
            type: "kill",
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
module.exports = { Handle };
