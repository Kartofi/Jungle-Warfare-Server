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
    walkSpeed: 5,
    reloadWalkSpeed: 2.5,
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
    walkSpeed: 5,
    reloadWalkSpeed: 3.5,
    recoilMultiplier: 5,
    shootMaxDistance: 40,
    shootIndicatorDistance: 40,
    bulletsMax: 6,
    reloadTime: 1,
    damage: 33,
    headShotMultiplier: 2,
  },
];

let defaultRulesForPlayer = {
  maxHealth: 100,
  jumpCooldown: 1,

  respawnTime: 5 * 1000,

  lobbySize: 20,

  weaponsRules: defaultWeaponsRules,
};
global.lobbies = {

};

//Game AntiCheat Properties
global.rules = {
  updateDelay: 50,
  maxMoveDistance: 2.5,

  headPosY: 1,
  headRadius: 0.62,

  spawnPos: new Vectors.Vector3(0, 1.5, 0),
};
function randomLobby() {
  let keys = Object.keys(lobbies);
  let notFullLobbies = [];
  keys.forEach((key) => {
    if (lobbies[key].players.length < lobbies[key].rules.lobbySize) {
      notFullLobbies.push(key);
    }
  });
  if (notFullLobbies.length > 0) {
    if (notFullLobbies.length == 1) {
      return notFullLobbies[0];
    } else {
      return notFullLobbies[crypto.randomInt(0, notFullLobbies.length - 1)];
    }
  } else {
    return null;
  }
}
function getWeaponData(name, lobby) {
  if (lobbies[lobby] == null) {
    return;
  }

  let found = null;

  lobbies[lobby].rules.weaponsRules.forEach((item) => {
    if (item.WeaponName == name) {
      found = item;
    }
  });

  return found;
}
function randomWeapon(lobby) {
  if (lobbies[lobby] == null) {
    return;
  }
  return lobbies[lobby].rules.weaponsRules[0];
}
function checkIfSessionIsIn(sessionId) {
  var keys = Object.keys(lobbies);
  let found = null;
  keys.forEach((key) => {
    let checkIfSessionIsIn = lobbies[key].players.find(
      (element) => element.sessionId == sessionId
    );
    if (checkIfSessionIsIn != null) {
      found = key;
    }
  });
  return found;
}
function checkIfDeviceIdIsIn(deviceId) {
  var keys = Object.keys(lobbies);
  let found = null;
  keys.forEach((key) => {
    let checkIfDeviceIdIsIn = lobbies[key].players.find(
      (element) => element.deviceId == deviceId
    );
    if (checkIfDeviceIdIsIn != null) {
      found = key;
    }
  });
  return found;
}
function checkIfNameIsIn(name) {
  var keys = Object.keys(lobbies);
  let found = null;
  keys.forEach((key) => {
    let checkIfSessionIsIn = lobbies[key].players.find(
      (element) => element.name == name
    );
    if (checkIfSessionIsIn != null) {
      found = key;
    }
  });
  return found;
}
function getPlayerUsingName(name) {
  var keys = Object.keys(lobbies);
  let found = null;
  keys.forEach((key) => {
    let checkIfSessionIsIn = lobbies[key].players.find(
      (element) => element.name == name
    );
    if (checkIfSessionIsIn != null) {
      found = checkIfSessionIsIn;
    }
  });
  return found;
}
function RemovePlayerUsingName(name) {
  var keys = Object.keys(lobbies);

  keys.forEach((match) => {
    lobbies[match].players.forEach((element) => {
      if (element && element.name == name) {
        var index = lobbies[match].players.indexOf(element);
        if (index > -1) {
          lobbies[match].players.splice(index, 1);
          if (lobbies[match].players.length <= 0) {
            delete lobbies[match];
            console.log("Removed match :" + match);
          }
        }
      }
    });
  });
}
async function HandleShooting(json, info) {
  let time = new Date().getTime();
  try {
    let match = checkIfSessionIsIn(json.sessionId);
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
    let weaponData = getWeaponData(shooterInstance.weapon, match);
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
      
      targetInstance.health -= json.headShot ? weaponData.damage * weaponData.headShotMultiplier : weaponData.damage
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
        let newWeapon = randomWeapon(match);
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
function HandleShootIndicator(json, info) {
  let time = new Date().getTime();
  let match = checkIfSessionIsIn(json.sessionId);
  if (match == null) {
    return;
  }
  let shooterInstance = lobbies[match].players.find(
    (element) =>
      element.name == json.from &&
      element.deviceId == json.deviceId &&
      element.sessionId == json.sessionId
  );
  if (shooterInstance == null || shooterInstance.weapon == null) {
    return;
  }
  let weaponData = getWeaponData(shooterInstance.weapon, match);
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
  tcp.broadcast(
    JSON.stringify({
      type: "shootIndicator",
      from: json.from,
      hit: json.hit,
      hitColor: json.hitColor,
      playerHit: json.playerHit,
      emissionIntensity: json.emissionIntensity,
    }),
    shooterInstance.lobbyId
  );
}
async function HandleReload(json, info) {
  let time = new Date().getTime();
  let lobby = checkIfSessionIsIn(json.sessionId);
  if (lobby == null) {
    return;
  }
  let playerInstance = lobbies[lobby].players.find(
    (element) =>
      element.name == json.name &&
      element.deviceId == json.deviceId &&
      element.sessionId == json.sessionId &&
      element.ip == info.address
  );
  let weaponData = await getWeaponData(playerInstance.weapon, lobby);
  if (playerInstance == null || weaponData == null) {
    return;
  }
  if (
    playerInstance.bullets < weaponData.bulletsMax &&
    time - playerInstance.lastReload > weaponData.reloadTime * 1000
  ) {
    playerInstance.reloading = true;
    tcp.broadcast(
      JSON.stringify({ type: "reload", from: playerInstance.name }),
      lobby,
      null
    );
    await Basic.Wait(weaponData.reloadTime * 1000);
    playerInstance.bullets = weaponData.bulletsMax;
    playerInstance.reloading = false;
  }
}
function HandleBullets(json, info) {
  let lobby = checkIfSessionIsIn(json.sessionId);
  if (lobby == null) {
    return;
  }
  let shooterInstance = lobbies[lobby].players.find(
    (element) =>
      element.name == json.from &&
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
function HandleDisconnect(json, info) {
  let playerInstance = getPlayerUsingName(json.name);
  if (playerInstance == null) {
    return;
  }
  if (
    playerInstance.name == json.name &&
    playerInstance.deviceId == json.deviceId &&
    playerInstance.ip == info.address &&
    playerInstance.sessionId == json.sessionId
  ) {
    console.log("Player: " + json.name + " left!");
    tcp.broadcast(
      JSON.stringify({
        type: "sendMessage",
        from: "Server",
        request: json.name + " left the lobby.",
      }),
      playerInstance.lobbyId,
      null
    );
    if (lobbies[playerInstance.lobbyId].players.length <= 0) {
      delete lobbies[playerInstance.lobbyId];
      console.log("Removed lobby: " + playerInstance.lobbyId);
    }
    RemovePlayerUsingName(json.name);
  }
}
async function HandleUpdate(json, server, info) {
  let playerInstance = getPlayerUsingName(json.name);

  if (
    playerInstance &&
    (playerInstance.sessionId != json.sessionId ||
      playerInstance.deviceId != json.deviceId)
  ) {
    server.send(
      JSON.stringify({
        type: "ExitGame",
        reason: "Account logged from another location.",
      }),
      info.port,
      info.address
    );
    return;
  }
  if (json.name.length <= 0) {
    server.send(
      JSON.stringify({
        type: "ExitGame",
        reason: "Account name is too short.",
      }),
      info.port,
      info.address
    );
    return;
  } else if (json.name.length > 20) {
    server.send(
      JSON.stringify({
        type: "ExitGame",
        reason: "Account name is too long.",
      }),
      info.port,
      info.address
    );
    return;
  }

  if (json.password.length <= 0) {
    server.send(
      JSON.stringify({
        type: "ExitGame",
        reason: "Account password is too short.",
      }),
      info.port,
      info.address
    );
    return;
  }
  if (playerInstance == null) {
    if (mongoDB.isConnected() == false) {
      server.send(
        JSON.stringify({
          type: "ExitGame",
          reason: "There was a problem please try again later.",
        }),
        info.port,
        info.address
      );
      return;
    }
    let accountCredentialsCheck = await mongoDB.CheckCredentials(
      json.name,
      json.password
    );
    if (accountCredentialsCheck == false) {
      server.send(
        JSON.stringify({
          type: "ExitGame",
          reason: "Wrong password or name!",
        }),
        info.port,
        info.address
      );
      return;
    }
  }
  if (json.versionHash != currentVersionHash){
    server.send(
      udpErrors.outDatedClient,
      info.port,
      info.address
    );
    return;
  }

  let time = new Date().getTime();
  if (playerInstance == null) {
    if (
      checkIfSessionIsIn(json.sessionId) != null || //|| //testing
      //checkIfDeviceIdIsIn(json.deviceId) != null
      json.sessionId
    ) {
      server.send(
        udpErrors.problemRejoin,
        info.port,
        info.address
      );
      return;
    }

    let sessionId = uuidv4();
    let lobby;
    if (json.lobbyId != "" && json.lobbyId != null) {
      if (json.lobbyId.length > 20) {
        lobby = json.lobbyId.slice(0, 20);
      } else {
        lobby = json.lobbyId;
      }
      let lobbiesKeys = Object.keys(lobbies);
      if (!lobbiesKeys.includes(lobby)) {
        lobbies[lobby] = {
          players: [],
          creator: json.name,
          rules:
            !json.rules ||
            json.rules.weaponsRules.length < defaultWeaponsRules.length ||
            json.rules.lobbySize <= 0
              ? defaultRulesForPlayer
              : json.rules,
        };
        console.log("Created lobby :" + lobby);
      }
    } else {
      lobby = randomLobby();
      if (lobby == null) {
        server.send(
          udpErrors.joinableLobbies,
          info.port,
          info.address
        );
        return;
      }
    }
    if (lobbies[lobby].rules.lobbySize == lobbies[lobby].players.length) {
      // check if lobby is full
      server.send(
        JSON.stringify({
          type: "ExitGame",
          reason: "The lobby is full.",
        }),
        info.port,
        info.address
      );
      return;
    }
    console.log("Player: " + json.name + " joined lobby:" + lobby + "!");
    let weapon = randomWeapon(lobby);
    lobbies[lobby].players.push({
      name: json.name,
      deviceId: json.deviceId,
      sessionId: sessionId,
      lobbyId: lobby,
      ping: json.ping,
      ip: info.address,
      weapon: weapon == null ? "" : weapon.WeaponName,
      health: lobbies[lobby].rules.maxHealth,
      bullets: weapon == null ? 0 : weapon.bulletsMax,
      isDead: false,
      state: "idle",
      kills: 0,
      CameraData: json.CameraData
        ? json.CameraData
        : {
            position: new Vectors.Vector3(0, 0, 0).JsonObj,
            rotation: new Vectors.Vector3(0, 0, 0).JsonObj,
          },
      position: rules.spawnPos.JsonObj,
      rotation: json.rotation,
      lastUpdate: time,
      lastShoot: 0,
      lastReload: 0,
      reloading: false,
    });

    const players = lobbies[lobby].players.map(
      ({ ip, deviceId, sessionId, lastUpdate, lastShoot, lobbyId, ...rest }) =>
        rest
    );

    server.send(
      JSON.stringify({
        type: "position",
        reason: "startPos",
        correctPosition: rules.spawnPos.JsonObj,
        sessionId: sessionId,
        lobbyId: lobby,
        rules: Object.assign({}, lobbies[lobby].rules, {
          maxMoveDistance: rules.maxMoveDistance,
        }),
        players: players,
      }),
      info.port,
      info.address
    );
    tcp.broadcast(
      JSON.stringify({
        type: "sendMessage",
        from: "Server",
        request: json.name + " joined the lobby.",
      }),
      lobby,
      null
    );
    return;
  } else {
    if (AntiCheat.PositionChange(server, playerInstance, json, time, info)) {
      playerInstance.position = json.position;
      playerInstance.rotation = json.rotation;
      playerInstance.lastUpdate = time;
      playerInstance.CameraData = json.CameraData;
      playerInstance.ping = json.ping;
      playerInstance.state = json.state;
    } else {
      if (checkIfSessionIsIn(json.sessionId) == null) {
        return;
      }
      const players = lobbies[playerInstance.lobbyId].players.map(
        ({
          ip,
          deviceId,
          sessionId,
          lastUpdate,
          lastShoot,
          lobbyId,
          ...rest
        }) => rest
      );
      server.send(
        JSON.stringify({
          type: "position",
          reason: "hacker",
          correctPosition: playerInstance.position,
          players: players,
        }),
        info.port,
        info.address
      );
      return;
    }
  }
  if (checkIfSessionIsIn(json.sessionId) == null) {
    return;
  }
  const players = lobbies[playerInstance.lobbyId].players.map(
    ({ ip, deviceId, sessionId, lastUpdate, lastShoot, lobbyId, ...rest }) =>
      rest
  );
  server.send(
    JSON.stringify({
      players: players,
      rules: lobbies[playerInstance.lobbyId].rules,
    }),
    info.port,
    info.address
  );
}

function RemoveNotUpdated() {
  let time = new Date().getTime();
  var keys = Object.keys(lobbies);

  keys.forEach((lobby) => {
    lobbies[lobby].players.forEach((element) => {
      if (element.lastUpdate && time - element.lastUpdate >= 10000) {
        var index = lobbies[lobby].players.indexOf(element);
        if (index > -1) {
          lobbies[lobby].players.splice(index, 1);
          console.log("Player: " + element.name + " lost connection!");
          tcp.broadcast(
            JSON.stringify({
              type: "sendMessage",
              from: "Server",
              request: element.name + " lost connection.",
            }),
            lobby,
            null
          );
          if (lobbies[lobby].players.length <= 0) {
            delete lobbies[lobby];
            console.log("Removed lobby: " + lobby);
          }
        }
      }
    });
  });
}

setInterval(RemoveNotUpdated, 10000);

server.on("message", async (message, info) => {
  let json;
  try {
    json = JSON.parse(message.toString());
  } catch (e) {
    return;
  }
  if (json.type == "disconnect") {
    HandleDisconnect(json, info);
  } else if (json.type == "shoot") {
    HandleBullets(json, info);
    if (json.shootType == "shootIndicator") {
      HandleShootIndicator(json, info);
    } else if (json.shootType == "damageHit") {
      HandleShooting(json, info);
    }
  } else if (json.type == "reload") {
    HandleReload(json, info);
  } else if (json.type == "keepAlive") {
    if (checkIfSessionIsIn(json.sessionId) == false) {
      return;
    }
    let time = new Date().getTime();
    let player = getPlayerUsingName(json.name);
    if (!player || time - player.lastUpdate < rules.updateDelay) {
      return;
    }
    player.lastUpdate = time;
    player.state = json.state;
    const players = lobbies[player.lobbyId].players.map(
      ({ ip, deviceId, sessionId, lastUpdate, lastShoot, ...rest }) => rest
    );
    server.send(JSON.stringify({ players: players }), info.port, info.address);
  } else if (json.type == "ping") {
    if (checkIfSessionIsIn(json.sessionId) == false) {
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
    HandleUpdate(json, server, info);
  }
});

server.bind(port);
