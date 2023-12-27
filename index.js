const UDP = require("dgram");

const server = UDP.createSocket("udp4");

const Vectors = require("./Utils/Vectors");
const Basic = require("./Utils/Basic");
const AntiCheat = require("./Utils/AntiCheat");
const mongoDB = require("./Utils/MongoDBManager");
const udpErrors = require("./Utils/udpErrors");

const { v1: uuidv1, v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const tcp = require("./tcp");
const startMenuTcp = require("./startMenuHttp");

const port = 2222;
server.on("listening", () => {
  const address = server.address();
  console.log("UDP server is listening on port ", address.port);
});

const fs = require("fs");

global.version = "1.0.0";

global.currentVersionHash = "47cd76e43f74bbc2e1baaf194d07e1fa";
//crypto.createHash('md5').update(version).digest('hex');;

global.defaultWeaponsRules = [
  {
    WeaponName: "Rifle",
    shootCooldown: 0.1,
    walkSpeed: 7,
    reloadWalkSpeed: 5,
    recoilMultiplier: 1,
    shootMaxDistance: 20,
    shootIndicatorDistance: 20,
    bulletsMax: 30,
    reloadTime: 1,
    damage: 10,
    headShotMultiplier: 1.5,
  },
  {
    WeaponName: "Revolver",
    shootCooldown: 0.5,
    walkSpeed: 7,
    reloadWalkSpeed: 6,
    recoilMultiplier: 5,
    shootMaxDistance: 40,
    shootIndicatorDistance: 40,
    bulletsMax: 6,
    reloadTime: 1,
    damage: 33,
    headShotMultiplier: 2,
  },
];

global.defaultRulesForPlayer = {
  maxHealth: 100,
  jumpCooldown: 1,

  respawnTime: 5 * 1000,

  lobbySize: 20,

  weaponsRules: defaultWeaponsRules,
};
global.lobbies = {};

//Game AntiCheat Properties
global.rules = {
  updateDelay: 50,
  maxMoveDistance: 2.5,

  headPosY: 1,
  headRadius: 0.62,

  spawnPos: new Vectors.Vector3(0, 1.5, 0),

  maxLobbyPlayers: 50,
};

const lobbyManager = require("./Utils/lobbyManager");

const disconnect = require("./Utils/GameLogic/disconnect");
const shootIndicator = require("./Utils/GameLogic/shootIndicator");
const bullets = require("./Utils/GameLogic/bullets");
const updateData = require("./Utils/GameLogic/updateData");

async function HandleShooting(json, info) {
  let time = new Date().getTime();
  try {
    let match = lobbyManager.checkIfSessionIsIn(json.sessionId);
    if (match == null) {
      return;
    }
    let lobbyInstance = lobbies[match];
    let shooterInstance = lobbyInstance.players.find(
      (element) =>
        element.name == json.name &&
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
        tcp.broadcast(
          JSON.stringify({
            type: "kill",
            from: shooterInstance.name,
            to: targetInstance.name,
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

setInterval(lobbyManager.RemoveNotUpdated, 10000);

server.on("message", async (message, info) => {
  let json;
  try {
    json = JSON.parse(message.toString());
  } catch (e) {
    return;
  }
  if (json.type == "disconnect") {
    disconnect.Disconnect(json, info, tcp.broadcast);
  } else if (json.type == "shoot") {
    bullets.Handle(json, info);
    if (json.shootType == "shootIndicator") {
      shootIndicator.Handle(json, info, tcp.broadcast);
    } else if (json.shootType == "damageHit") {
      HandleShooting(json, info);
    }
  } else if (json.type == "keepAlive") {
    if (lobbyManager.checkIfSessionIsIn(json.sessionId) == false) {
      return;
    }
    let time = new Date().getTime();
    let player = lobbyManager.getPlayerUsingName(json.name);
    if (!player || time - player.lastUpdate < rules.updateDelay) {
      return;
    }
    player.lastUpdate = time;
    player.state = json.state;
    player.ping = Basic.Clamp(json.ping, 0, 999);
    const players = lobbies[player.lobbyId].players.map(
      ({ ip, deviceId, sessionId, lastUpdate, lastShoot, ...rest }) => rest
    );
    server.send(JSON.stringify({ players: players }), info.port, info.address);
  } else if (json.type == "ping") {
    if (lobbyManager.checkIfSessionIsIn(json.sessionId) == false) {
      return;
    }
    server.send(
      JSON.stringify({
        type: "pong",
      }),
      info.port,
      info.address
    );
  } else {
    updateData.Update(json, server, info, tcp.broadcast);
  }
});

server.bind(port);
